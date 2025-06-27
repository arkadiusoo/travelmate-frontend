import React, { useState, useEffect, useRef, useMemo} from 'react';
import { Button, Card, Modal, Form, Spinner, InputGroup, Row, Col, ListGroup } from 'react-bootstrap';
import { BsTrash, BsPencil, BsArrowDown, BsCheckCircle, BsJournalText } from 'react-icons/bs';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMapEvents,
  useMap
} from 'react-leaflet';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // ✅ Import useAuth
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MainLayout from '../layouts/MainLayout';
import WideModalWrapper from "../components/WideModalWrapper";
import ExpenseForm from "../components/budget/ExpenseForm";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

function MapSetter({ setMap, setHasUserInteracted }) {
  const map = useMap();

  useEffect(() => {
    setMap(map);

    const handleMoveStart = () => setHasUserInteracted(true);
    map.on('movestart', handleMoveStart);

    return () => {
      map.off('movestart', handleMoveStart);
    };
  }, [map, setMap, setHasUserInteracted]);

  return null;
}

export default function PlanTrip() {
  const { id: tripId } = useParams();
  const { token } = useAuth(); // ✅ Get auth token
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  // ✅ Add helper function for auth headers
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // State hooks
  const [tripName, setTripName] = useState('');
  const [points, setPoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showModalExpense, setShowModalExpense] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '' });
  const [position, setPosition] = useState(null);
  const [loadingName, setLoadingName] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [map, setMap] = useState(null);
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [routeDistance, setRouteDistance] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [autoForm, setAutoForm] = useState({
    city: '',
    dateFrom: '',
    dateTo: ''
  });

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [notePointId, setNotePointId] = useState(null);

  // State for passing point data to ExpenseForm
  const [expenseFormData, setExpenseFormData] = useState(null);


  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!token) return; // ✅ Don't make requests without token

    // ✅ Add auth headers to trip name fetch
    fetch(`${API_BASE}/trips/${tripId}`, {
      headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(data => setTripName(data.name))
        .catch(console.error);

    // ✅ Add auth headers to points fetch
    fetch(`${API_BASE}/trips/${tripId}/points`, {
      headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(data => setPoints(data.map(p => ({
          ...p,
          position: { lat: p.latitude, lng: p.longitude }
        }))))
        .catch(console.error);
  }, [tripId, token]); // ✅ Add token as dependency

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    const len = value.length;
    if (len >= 3) {
      fetch(`${API_BASE}/places/search?q=${encodeURIComponent(value)}`, {
        headers: getAuthHeaders()
      })
          .then(res => res.json())
          .then(data => {
            if (data.predictions) {
              setSuggestions(data.predictions.map(p => ({
                description: p.description,
                placeId: p.place_id
              })));
            }
          })
          .catch(console.error);

    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (s) => {
    fetch(`${API_BASE}/places/details?placeId=${s.placeId}`, {
      headers: getAuthHeaders()
    })
        .then(res => res.json())
        .then(result => {
          const location = result.result.geometry.location;

          const latlng = { lat: location.lat, lng: location.lng };
          setPosition(latlng);

          if (map) map.flyTo([latlng.lat, latlng.lng], 13);

          setForm({
            title: result.result.name || s.description.split(',')[0],
            date: today,
            description: result.result.formatted_address || ''
          });

          setEditingId(null);
          setShowModal(true);
          setSuggestions([]);
          setSearch('');
        })
        .catch(console.error);
  };

  const handleMapClick = async (latlng) => {
    setPosition(latlng);
    setForm({ title: '', date: today, description: '' });
    setEditingId(null);
    setShowModal(true);
    setLoadingName(true);

    let poiName = '', cityName = '';
    try {
      const overpassQuery = `
        [out:json];
        (node(around:20,${latlng.lat},${latlng.lng})[name];
         way(around:20,${latlng.lat},${latlng.lng})[name];
         relation(around:20,${latlng.lat},${latlng.lng})[name];
        );
        out tags 1;
      `;
      const poiRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' },
      });
      const poiData = await poiRes.json();
      if (poiData.elements?.length) poiName = poiData.elements[0].tags.name;
    } catch (e) {
      console.warn('Overpass error:', e);
    }

    try {
      const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await resp.json();
      const addr = data.address || {};
      cityName = addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
    } catch (e) {
      console.warn('Nominatim error:', e);
    }

    const title = poiName
        ? (cityName ? `${poiName}, ${cityName}` : poiName)
        : cityName;
    setForm(prev => ({ ...prev, title, date: today }));
    setLoadingName(false);
  };


  const openNoteModal = (pointId) => {
    setNotePointId(pointId);
    setNoteContent('');
    setShowNoteModal(true);
  };  


  const openEdit = (pt) => {
    setPosition(pt.position);
    setForm({ title: pt.title, date: pt.date, description: pt.description });
    setEditingId(pt.id);
    setShowModal(true);
    setLoadingName(false);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleMarkVisited = (e) => {
    if (!token) return;
  
    fetch(`${API_BASE}/trips/${tripId}/points/${e}/visited`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    })
      .then(res => {
        if (!res.ok) throw new Error("Błąd oznaczania punktu jako odwiedzonego");
        return res.json();
      })
      .then(updated => {
        setPoints(prev => prev.map(p => p.id === e ? { ...p, visited: true } : p));
      })
      .catch(console.error);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !position || !token) return; // ✅ Check for token

    const payload = {
      title: form.title,
      date: form.date,
      description: form.description,
      latitude: position.lat,
      longitude: position.lng,
      visited: false
    };
    const url = `${API_BASE}/trips/${tripId}/points${editingId ? `/${editingId}` : ''}`;
    const method = editingId ? 'PUT' : 'POST';

    // ✅ Add auth headers to save request
    fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    })
        .then(res => res.json())
        .then(item => {
          setPoints(prev => {
            const updated = editingId
                ? prev.map(p => p.id === editingId ? { ...item, position } : p)
                : [...prev, { ...item, position }];
            return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
          });
        })
        .catch(console.error);

    setShowModal(false);
    setForm({ title: '', date: '', description: '' });
    setPosition(null);
    setEditingId(null);
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    if (!token) return; // ✅ Check for token

    // ✅ Add auth headers to delete request
    fetch(`${API_BASE}/trips/${tripId}/points/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    })
        .then(() => setPoints(prev => prev.filter(p => p.id !== id)))
        .catch(console.error);
  };

  const dates = [...new Set(points.map(p => p.date))];
  const displayPoints = useMemo(
    () => points.filter(p => !filterDate || p.date === filterDate),
    [points, filterDate]
  );

  // previous coords
  const previousCoordsRef = useRef('');

  useEffect(() => {
    if (!filterDate || displayPoints.length < 2) {
      if (routeCoords.length > 0 || routeDistance !== null) {
        setRouteCoords([]);
        setRouteDistance(null);
      }
      return;
    }
  
    // Budujemy trasę, ignorując tylko odcinki gdzie oba punkty są 'visited'
    const segments = [];
    const coordsForApi = [];
  
    for (let i = 0; i < displayPoints.length - 1; i++) {
      const curr = displayPoints[i];
      const next = displayPoints[i + 1];
  
      // Dodajemy odcinek tylko jeśli NIE są oba odwiedzone
      if (!(curr.visited && next.visited)) {
        segments.push([curr, next]);
        coordsForApi.push(curr.position);
      }
    }
  
    // Dodaj ostatni punkt jeśli istnieje przynajmniej jeden segment
    if (segments.length > 0) {
      coordsForApi.push(segments[segments.length - 1][1].position);
    }
  
    if (coordsForApi.length < 2) {
      setRouteCoords([]);
      setRouteDistance(null);
      return;
    }
  
    const coordsString = coordsForApi.map(p => `${p.lng},${p.lat}`).join(';');
  
    if (coordsString !== previousCoordsRef.current) {
      fetch(`https://router.project-osrm.org/route/v1/walking/${coordsString}?overview=full&geometries=geojson`)
        .then(res => res.json())
        .then(data => {
          if (data.routes?.length) {
            const route = data.routes[0];
            const geo = route.geometry.coordinates;
            setRouteCoords(geo.map(c => [c[1], c[0]]));
            setRouteDistance(route.distance);
          }
        })
        .catch(console.error);
  
      previousCoordsRef.current = coordsString;
    }
  }, [displayPoints, filterDate]);
  


  useEffect(() => {
    if (!map || displayPoints.length === 0 || hasUserInteracted) return;

    const bounds = L.latLngBounds(displayPoints.map(p => [p.position.lat, p.position.lng]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [filterDate, displayPoints, map, hasUserInteracted]);

  const handleZoomToPoint = (pt) => {
    if (!map) {
      console.warn('Mapa jeszcze nie zainicjalizowana');
      return;
    }
    map.flyTo([pt.position.lat, pt.position.lng], 13);
  };
  const handleAddExpense = (pt) => {
    // Pass point data to the ExpenseForm component
    setExpenseFormData({
      title: pt.title,
      date: pt.date,
      description: pt.description,
      pointId: pt.id
    });
    setShowModalExpense(true);
  }
  // ✅ Add loading state for authentication
  if (!token) {
    return (
        <MainLayout>
          <div className="text-center">
            <Spinner animation="border" />
            <p>Ładowanie...</p>
          </div>
        </MainLayout>
    );
  }

  return (
      <MainLayout>
        <h1 className="mb-4 text-center">{tripName}</h1>
        <Row className="align-items-center mb-3">
          <Col md={5} className="mt-3">
            <Form.Group className="mb-3">
              <div className="d-flex justify-content-end mb-2">
                <Button
                    variant="success"
                    onClick={() => setShowAutoModal(true)}>
                  Generuj wycieczkę automatycznie
                </Button>
              </div>
              <Form.Label>Wyszukaj miejsce</Form.Label>
              <Form.Control
                  type="text"
                  placeholder="Wpisz nazwę miejsca..."
                  value={search}
                  onChange={handleSearchChange}
              />
              {suggestions.length > 0 && (
                  <ListGroup className="mt-1">
                    {suggestions.map((s) => (
                        <ListGroup.Item key={s.place_id} action onClick={() => handleSuggestionClick(s)}>
                          {s.description}
                        </ListGroup.Item>
                    ))}

                  </ListGroup>
              )}
            </Form.Group>
            <Form.Select
                className="mb-3"
                value={filterDate}
                onChange={e => {
                  setFilterDate(e.target.value);
                  setHasUserInteracted(false);
                }}
            >
              <option value="">Wszystkie dni</option>
              {dates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('pl-PL')}</option>)}
            </Form.Select>
            <Col className="text-md-end">
              <div className="timeline" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {displayPoints.length === 0 ? (
                    <p className="text-center">Brak punktów na wybrany dzień.</p>
                ) : displayPoints.map((pt, idx) => (
                    <div key={pt.id} className="d-flex flex-column align-items-center mb-4">
                      <Card
                          className={`shadow-sm w-100 ${new Date(pt.date) < new Date(today) ? 'bg-light text-muted' : ''}`}
                          onClick={() => handleZoomToPoint(pt)}
                          style={{ cursor: 'pointer' }}
                      >
                        <Card.Body className="d-flex">
                          <Button
                              variant="outline-primary"
                              size="sm"
                              className="mb-2"
                              onClick={() => handleAddExpense(pt)}
                          >Dodaj wydatek</Button>
                          <div className="flex-grow-1 me-3">
                          <h5 className={pt.visited ? 'text-success' : ''}>{pt.title}</h5>
                            <small className="text-muted">
                              {new Date(pt.date).toLocaleDateString('pl-PL')}
                            </small>
                            <p className="mt-2 mb-0">{pt.description}</p>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
      <Button variant="outline-primary" size="sm" onClick={e => { e.stopPropagation(); openEdit(pt); }} title="Edytuj">
        <BsPencil />
      </Button>
      <Button variant="outline-danger" size="sm" onClick={e => handleRemove(e, pt.id)} title="Usuń">
        <BsTrash />
      </Button>
      <Button variant="outline-success" size="sm" title="Oznacz jako odwiedzone" onClick={e => { e.stopPropagation(); handleMarkVisited(pt.id); }} disabled={pt.visited}>
        <BsCheckCircle /> 
      </Button>
      <Button variant="outline-warning" size="sm" style={{ minWidth: '30px' }} onClick={() => openNoteModal(pt.id)} title="Notatki">
        <BsJournalText />
      </Button>
    </div>
                        </Card.Body>

                      </Card>
                      {idx < displayPoints.length - 1 && (
                          <BsArrowDown size={24} color="#0d6efd" className="my-2" />
                      )}
                    </div>
                ))}
              </div>
            </Col>
          </Col>
          <Col md={7}>
            <div style={{ height: '450px' }} className="mb-4">
              <MapContainer
                  center={[52.237049, 21.017532]}
                  zoom={6}
                  style={{ height: '100%', width: '100%' }}
              >
                <MapSetter setMap={setMap} setHasUserInteracted={setHasUserInteracted} />

                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationSelector onSelect={handleMapClick} />
                {displayPoints.map(pt => (
                    <Marker key={pt.id} position={[pt.position.lat, pt.position.lng]}>
                      <Popup>
                        <strong>{pt.title}</strong><br />{pt.date}
                      </Popup>
                    </Marker>
                ))}
                {routeCoords.length > 1 && (
                    <Polyline positions={routeCoords} pathOptions={{ color: '#0d6efd', weight: 4 }} />
                )}
              </MapContainer>
            </div>
            {filterDate && routeDistance != null && (
                <p className="text-center mt-3">
                  Trasa do przebycia na dzień <strong>{new Date(filterDate).toLocaleDateString('pl-PL')}</strong> ma długość: <strong>{(routeDistance / 1000).toFixed(2)} km</strong>
                </p>
            )}
          </Col>
        </Row>
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>
              {editingId ? 'Edytuj punkt' : 'Dodaj punkt podróży'}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSave}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Pozycja</Form.Label>
                <Form.Control
                    type="text"
                    readOnly
                    value={position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : ''}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formTitle">
                <Form.Label>Nazwa punktu *</Form.Label>
                <InputGroup>
                  {loadingName && <Spinner animation="border" size="sm" className="me-2" />}
                  <Form.Control
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      placeholder={loadingName ? 'Ładowanie nazwy...' : ''}
                      required
                      disabled={loadingName}
                  />
                </InputGroup>
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDate">
                <Form.Label>Data *</Form.Label>
                <Form.Control
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    min={today}
                />
              </Form.Group>
              <Form.Group className="mb-3" controlId="formDescription">
                <Form.Label>Opis</Form.Label>
                <Form.Control
                    as="textarea"
                    name="description"
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Opcjonalny opis"
                />
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Anuluj</Button>
              <Button variant="primary" type="submit" disabled={loadingName}>Zapisz</Button>
            </Modal.Footer>
          </Form>
        </Modal>
        <Modal show={showAutoModal} onHide={() => setShowAutoModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Generuj wycieczkę</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Miasto</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Nazwa miasta"
                    value={autoForm.city}
                    onChange={(e) => setAutoForm({ ...autoForm, city: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Data rozpoczęcia</Form.Label>
                <Form.Control
                    type="date"
                    value={autoForm.dateFrom}
                    min={today}
                    onChange={(e) => setAutoForm({ ...autoForm, dateFrom: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Data zakończenia</Form.Label>
                <Form.Control
                    type="date"
                    value={autoForm.dateTo}
                    min={autoForm.dateFrom || today}
                    onChange={(e) => setAutoForm({ ...autoForm, dateTo: e.target.value })}
                />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAutoModal(false)}>Anuluj</Button>
            <Button
                variant="primary"
                onClick={() => {
                  const prompt = `Miasto : ${autoForm.city}, Data : ${autoForm.dateFrom} - ${autoForm.dateTo}`;

                  // ✅ Add auth headers to chat request
                  fetch(`${API_BASE}/chat`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify({ prompt, tripId })
                  })
                      .then(res => res.json())
                      .then(data => {
                        const newPoints = data.map(p => ({
                          title: p.name,
                          description: p.address,
                          date: p.date,
                          position: { lat: p.lat, lng: p.lng },
                          latitude: p.lat,
                          longitude: p.lng
                        }));

                        Promise.all(
                          newPoints.map(p =>
                            fetch(`${API_BASE}/trips/${tripId}/points`, {
                              method: 'POST',
                              headers: getAuthHeaders(),
                              body: JSON.stringify({
                                title: p.title,
                                date: p.date,
                                description: p.description,
                                latitude: p.latitude,
                                longitude: p.longitude,
                                visited: false
                              })
                            }).then(res => res.json())
                          )
                        )
                          .then(savedPoints => {
                            setPoints(prev =>
                              [...prev, ...savedPoints.map(p => ({
                                ...p,
                                position: { lat: p.latitude, lng: p.longitude }
                              }))].sort((a, b) => new Date(a.date) - new Date(b.date))
                            );
                          })
                          .catch(console.error);
                      })
                      .catch(console.error);

                  setShowAutoModal(false);
                }}
                disabled={!autoForm.city || !autoForm.dateFrom || !autoForm.dateTo}
            >
              Generuj
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showNoteModal} onHide={() => setShowNoteModal(false)} centered>
  <Modal.Header closeButton>
    <Modal.Title>Dodaj notatkę</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Form>
      <Form.Group>
        <Form.Label>Treść notatki</Form.Label>
        <Form.Control
          as="textarea"
          rows={4}
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
        />
      </Form.Group>
    </Form>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowNoteModal(false)}>Anuluj</Button>
    <Button
      variant="primary"
      onClick={() => {
        fetch(`${API_BASE}/notes/add?tripId=${tripId}`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            author: "Szymon", //
            content: noteContent,
            date: new Date().toISOString()
          })
        })
        .then(res => {
          if (!res.ok) throw new Error("Błąd dodawania notatki");
          return res.text();
        })
        .then(msg => {
          alert(msg);
          setShowNoteModal(false);
        })
        .catch(console.error);
      }}
      disabled={!noteContent.trim()}
    >
      Zapisz
    </Button>
  </Modal.Footer>
</Modal>


        <WideModalWrapper
            show={showModalExpense}
            onClose={() => setShowModalExpense(false)}
            title="Dodaj wydatek"
        >
          {expenseFormData && (
              <ExpenseForm
                  tripId={tripId}
                  onClose={() => setShowModalExpense(false)}
                  externalDate={expenseFormData.date}
                  name={expenseFormData.title}
              />
          )}
        </WideModalWrapper>

      </MainLayout>
  );
}