import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';
const PREFIX = 'TravelMate:';

export default function CalendarPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  const [gapiInited, setGapiInited] = useState(false);
  const [gisInited, setGisInited] = useState(false);
  const tokenClientRef = useRef(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  // Load GAPI and GSI scripts
  useEffect(() => {
    const loadScript = (src, onload) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = onload;
      document.body.appendChild(s);
    };
    loadScript('https://apis.google.com/js/api.js', () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        setGapiInited(true);
      });
    });
    loadScript('https://accounts.google.com/gsi/client', () => {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error) { setError('Błąd autoryzacji: ' + resp.error); return; }
          window.gapi.client.setToken({ access_token: resp.access_token });
          setIsSignedIn(true);
        }
      });
      setGisInited(true);
    });
  }, []);

  const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

  const handleAuthClick = () => {
    setError(null);
    if (!tokenClientRef.current) return setError('Klient GSI nie zainicjowany');
    const tokenClient = tokenClientRef.current;
    const current = window.gapi.client.getToken();
    tokenClient.requestAccessToken({ prompt: current ? '' : 'consent' });
  };

  const handleSignoutClick = () => {
    const t = window.gapi.client.getToken()?.access_token;
    if (t) {
      window.google.accounts.oauth2.revoke(t);
      window.gapi.client.setToken('');
      setIsSignedIn(false);
      setSuccessMsg(null);
      setConflicts([]);
    }
  };

  const handleSync = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    setConflicts([]);

    try {
      // Fetch trips and points from the API
      const tripsRes = await fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() });
      if (!tripsRes.ok) throw new Error('Błąd pobierania wycieczek');
      const trips = await tripsRes.json();

      const allPoints = [];
      for (const trip of trips) {
        const ptsRes = await fetch(`${API_BASE}/trips/${trip.id}/points`, { headers: getAuthHeaders() });
        if (!ptsRes.ok) throw new Error(`Błąd pobierania punktów dla ${trip.name}`);
        const pts = await ptsRes.json();
        pts.forEach(p => allPoints.push({ ...p, tripName: trip.name }));
      }

      // Fetch all existing TravelMate events
      const existingAll = await window.gapi.client.calendar.events.list({
        calendarId: 'primary',
        q: PREFIX,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 1000
      });
      const existingEvents = existingAll.result.items || [];

      // Mapping: summary -> trip point
      const pointBySummary = {};
      allPoints.forEach(p => {
        const key = `${PREFIX} ${p.tripName} - ${p.title}`;
        pointBySummary[key] = p;
      });

      let addedCount = 0;
      const conflictList = [];

      // Delete events that are outdated or removed
      for (const ev of existingEvents) {
        const summary = ev.summary;
        const p = pointBySummary[summary];
        const evDate = ev.start?.date; // only all-day events
        if (!p || p.date !== evDate) {
          await window.gapi.client.calendar.events.delete({ calendarId: 'primary', eventId: ev.id });
        }
      }

      // Add new events and collect external conflicts
      for (const p of allPoints) {
        const summary = `${PREFIX} ${p.tripName} - ${p.title}`;
        const startDate = p.date;
        const d = new Date(startDate);
        const next = new Date(d);
        next.setDate(d.getDate() + 1);
        const event = {
          summary,
          location: p.description || '',
          description: p.description || '',
          start: { date: startDate },
          end: { date: next.toISOString().split('T')[0] }
        };

        // Check existing events for that day
        const dayStart = new Date(startDate); dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(startDate); dayEnd.setHours(23,59,59,999);
        const existingDay = await window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });

        const items = existingDay.result.items || [];
        const alreadyExists = items.some(ev => ev.summary === summary);
        if (alreadyExists) continue;

        const conflictsForPoint = items.filter(ev => !ev.summary.startsWith(PREFIX));
        if (conflictsForPoint.length) {
          conflictList.push({ point: p, conflicts: conflictsForPoint });
        }

        // Always insert the event
        await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
        addedCount++;
      }

      // Detect conflicts between points from different trips on the same date
      const dateMap = {};
      allPoints.forEach(p => {
        if (!dateMap[p.date]) dateMap[p.date] = [];
        dateMap[p.date].push(p);
      });
      for (const date in dateMap) {
        const pts = dateMap[date];
        const tripNames = [...new Set(pts.map(p => p.tripName))];
        if (tripNames.length > 1) {
          pts.forEach(p => {
            // avoid duplicate entries if already flagged for external conflict
            if (!conflictList.some(c => c.point === p)) {
              // other points on same date from different trips
              const others = pts.filter(o => o.tripName !== p.tripName);
              conflictList.push({ point: p, conflicts: others });
            }
          });
        }
      }

      setConflicts(conflictList);
      setSuccessMsg(`Dodano ${addedCount} wydarzeń.`);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Container className="py-4">
        <h1 className="mb-4 text-center">Synchronizacja z Google Calendar</h1>
        {!isSignedIn ? (
          <Button onClick={handleAuthClick} disabled={!gapiInited || !gisInited} className="mb-3">
            Autoryzuj dostęp do Google Calendar
          </Button>
        ) : (
          <div className="d-flex gap-2 mb-3">
            <Button onClick={handleSync} disabled={loading}>
              {loading ? <><Spinner animation="border" size="sm" /> Synchronizuję...</> : 'Synchronizuj wycieczki'}
            </Button>
            <Button variant="outline-secondary" onClick={handleSignoutClick} disabled={loading}>
              Wyloguj Google
            </Button>
          </div>
        )}
        {error && <Alert variant="danger">{error}</Alert>}
        {successMsg && <Alert variant="success">{successMsg}</Alert>}
        {conflicts.length > 0 && (
          <Alert variant="warning">
            <h5>Konflikty terminów:</h5>
            <ul>
              {conflicts.map((c, idx) => (
                <li key={idx}>
                  <strong>{c.point.tripName} - {c.point.title}</strong> ({c.point.date}): istniejące wydarzenia
                </li>
              ))}
            </ul>
          </Alert>
        )}
      </Container>
    </MainLayout>
  );
}
