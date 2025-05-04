import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Form, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { BsTrash, BsPencil, BsArrowDown } from 'react-icons/bs';
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
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MainLayout from '../layouts/MainLayout';

// Fix Leaflet default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map click events and report latitude/longitude
function LocationSelector({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

// Component that grabs the map instance via hook
function MapSetter({ setMap }) {
  const map = useMap();
  useEffect(() => {
    setMap(map);
  }, [map, setMap]);
  return null;
}

export default function PlanTrip() {
  const { id: tripId } = useParams();
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

  // State hooks
  const [tripName, setTripName] = useState('');
  const [points, setPoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '' });
  const [position, setPosition] = useState(null);
  const [loadingName, setLoadingName] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);
  const [map, setMap] = useState(null);

  const today = new Date().toISOString().split('T')[0];

  // Load trip details and points
  useEffect(() => {
    fetch(`${API_BASE}/trips/${tripId}`)
      .then(res => res.json())
      .then(data => setTripName(data.name))
      .catch(console.error);

    fetch(`${API_BASE}/trips/${tripId}/points`)
      .then(res => res.json())
      .then(data => setPoints(data.map(p => ({
        ...p,
        position: { lat: p.latitude, lng: p.longitude }
      }))))
      .catch(console.error);
  }, [tripId]);

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

  const openEdit = (pt) => {
    setPosition(pt.position);
    setForm({ title: pt.title, date: pt.date, description: pt.description });
    setEditingId(pt.id);
    setShowModal(true);
    setLoadingName(false);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !position) return;
    const payload = {
      title: form.title,
      date: form.date,
      description: form.description,
      latitude: position.lat,
      longitude: position.lng
    };
    const url = `${API_BASE}/trips/${tripId}/points${editingId ? `/${editingId}` : ''}`;
    const method = editingId ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
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
    fetch(`${API_BASE}/trips/${tripId}/points/${id}`, { method: 'DELETE' })
      .then(() => setPoints(prev => prev.filter(p => p.id !== id)))
      .catch(console.error);
  };

  const dates = [...new Set(points.map(p => p.date))];
  const displayPoints = points.filter(p => !filterDate || p.date === filterDate);

  useEffect(() => {
    if (displayPoints.length < 2) return;
    const coords = displayPoints.map(p => `${p.position.lng},${p.position.lat}`).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes?.length) {
          const geo = data.routes[0].geometry.coordinates;
          setRouteCoords(geo.map(c => [c[1], c[0]]));
        }
      })
      .catch(console.error);
  }, [displayPoints]);

  const handleZoomToPoint = (pt) => {
    if (!map) {
      console.warn('Mapa jeszcze nie zainicjalizowana');
      return;
    }
    map.flyTo([pt.position.lat, pt.position.lng], 13);
  };

  return (
    <MainLayout>
      <h1 className="mb-4 text-center">{tripName}</h1>

      <div style={{ height: '450px' }} className="mb-4">
        <MapContainer
          center={[52.237049, 21.017532]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <MapSetter setMap={setMap} />
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

      <Row className="align-items-center mb-3">
        <Col md={4} className="mb-2">
          <Form.Select value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="">Wszystkie dni</option>
            {dates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('pl-PL')}</option>)}
          </Form.Select>
        </Col>
        <Col className="text-md-end">
          <Button variant="outline-secondary" size="sm" onClick={() => setFilterDate('')}>
            Wyczyść filtr
          </Button>
        </Col>
      </Row>

      <div className="timeline">
        {displayPoints.length === 0 ? (
          <p className="text-center">Brak punktów na wybrany dzień.</p>
        ) : displayPoints.map((pt, idx) => (
          <div key={pt.id} className="d-flex flex-column align-items-center mb-4">
            <Card
              className={`shadow-sm w-75 ${new Date(pt.date) < new Date(today) ? 'bg-light text-muted' : ''}`}
              onClick={() => handleZoomToPoint(pt)}
              style={{ cursor: 'pointer' }}
            >
              <Card.Body className="d-flex justify-content-between">
                <div>
                  <h5>{pt.title}</h5>
                  <small className="text-muted">
                    {new Date(pt.date).toLocaleDateString('pl-PL')}
                  </small>
                  <p className="mt-2">{pt.description}</p>
                </div>
                <div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={e => { e.stopPropagation(); openEdit(pt); }}
                  >
                    <BsPencil />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={e => handleRemove(e, pt.id)}
                  >
                    <BsTrash />
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
                min={dates[0] || today}
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
    </MainLayout>
  );
}
