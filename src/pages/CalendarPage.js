import React, { useState, useEffect, useRef } from "react";
import { Container, Button, Alert, Spinner } from "react-bootstrap";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

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

  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  useEffect(() => {
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
        setGapiInited(true);
      });
    };
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => {
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
    };
    document.body.appendChild(script2);
  }, []);

  const getAuthHeaders = () => ({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

  const handleAuthClick = () => {
    setError(null);
    if (!tokenClientRef.current) { setError('Klient GSI nie zainicjowany'); return; }
    const tokenClient = tokenClientRef.current;
    if (!window.gapi.client.getToken()) tokenClient.requestAccessToken({ prompt: 'consent' });
    else tokenClient.requestAccessToken({ prompt: '' });
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
      const tripsRes = await fetch(`${API_BASE}/trips`, { headers: getAuthHeaders() });
      if (!tripsRes.ok) throw new Error('Błąd pobierania wycieczek');
      const trips = await tripsRes.json();

      let allPoints = [];
      for (const trip of trips) {
        const ptsRes = await fetch(`${API_BASE}/trips/${trip.id}/points`, { headers: getAuthHeaders() });
        if (!ptsRes.ok) throw new Error(`Błąd pobierania punktów dla ${trip.name}`);
        const pts = await ptsRes.json();
        allPoints.push(...pts.map(p => ({ ...p, tripName: trip.name })));
      }

      let addedCount = 0;
      const conflictList = [];

      for (const p of allPoints) {
        const summary = `${p.tripName} - ${p.title}`;
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

        const dayStart = new Date(startDate);
        dayStart.setHours(0,0,0,0);
        const dayEnd = new Date(startDate);
        dayEnd.setHours(23,59,59,999);

        const existingResp = await window.gapi.client.calendar.events.list({
          calendarId: 'primary',
          timeMin: dayStart.toISOString(),
          timeMax: dayEnd.toISOString(),
          singleEvents: true,
          orderBy: 'startTime'
        });

        // Unikaj duplikatów: ten sam summary
        const alreadyExists = existingResp.result.items.some(ev => ev.summary === summary);
        if (alreadyExists) continue;

        // Wykryj konflikty tylko z wydarzeniami innych wycieczek
        const conflictsForPoint = existingResp.result.items.filter(ev =>
          !ev.summary.startsWith(`${p.tripName} - `)
        );
        if (conflictsForPoint.length > 0) {
          conflictList.push({ point: p, conflicts: conflictsForPoint });
        } else {
          await window.gapi.client.calendar.events.insert({ calendarId: 'primary', resource: event });
          addedCount++;
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

        {!isSignedIn && (
          <Button onClick={handleAuthClick} disabled={!gapiInited || !gisInited} className="mb-3">
            Autoryzuj dostęp do Google Calendar
          </Button>
        )}
        {isSignedIn && (
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