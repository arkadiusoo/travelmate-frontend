import React, { useState, useEffect } from 'react';
import { Button, Card, Modal, Form, Spinner, InputGroup, Row, Col } from 'react-bootstrap';
import { BsTrash, BsPencil, BsArrowDown } from 'react-icons/bs';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MainLayout from '../layouts/MainLayout';

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
      // Invoke callback when the map is clicked
      onSelect(e.latlng);
    }
  });
  return null;
}

export default function PlanTrip() {
  // State hooks
  const [points, setPoints] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', description: '' });
  const [position, setPosition] = useState(null);
  const [loadingName, setLoadingName] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [routeCoords, setRouteCoords] = useState([]);

  // Today's date in YYYY-MM-DD format, used as default
  const today = new Date().toISOString().split('T')[0];

  // Handle clicks on the map to add or edit a point
  const handleMapClick = async (latlng) => {
    // Store clicked position and reset form
    setPosition(latlng);
    setForm({ title: '', date: today, description: '' });
    setEditingId(null);
    setShowModal(true);
    setLoadingName(true);

    let poiName = '';
    let cityName = '';
    try {
      // Query Overpass API for nearby named POI within 20m
      const overpassQuery = `
        [out:json];
        (node(around:20,${latlng.lat},${latlng.lng})[name];way(around:20,${latlng.lat},${latlng.lng})[name];relation(around:20,${latlng.lat},${latlng.lng})[name];);
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
      // Reverse geocode with Nominatim to get city name
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`
      );
      const data = await resp.json();
      const addr = data.address || {};
      cityName = addr.city || addr.town || addr.village || addr.hamlet || addr.county || '';
    } catch (e) {
      console.warn('Nominatim error:', e);
    }

    // Construct default title from POI and city, if available
    const title = poiName ? (cityName ? `${poiName}, ${cityName}` : poiName) : cityName;
    setForm(prev => ({ ...prev, title, date: today }));
    setLoadingName(false);
  };

  // Open modal for editing an existing point
  const openEdit = (pt) => {
    setPosition(pt.position);
    setForm({ title: pt.title, date: pt.date, description: pt.description });
    setEditingId(pt.id);
    setShowModal(true);
    setLoadingName(false);
  };

  // Update form state on input change
  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  // Save a new or edited point to state
  const handleSave = (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !position) return;
    const newPoint = { ...form, id: editingId || Date.now(), position };
    setPoints(prev => {
      // Replace existing point if editing, else add new
      const list = editingId ? prev.map(p => p.id === editingId ? newPoint : p) : [...prev, newPoint];
      // Sort points chronologically by date
      return list.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    // Reset modal and form
    setShowModal(false);
    setForm({ title: '', date: '', description: '' });
    setPosition(null);
    setEditingId(null);
  };

  // Remove a point by its id
  const handleRemove = (id) => setPoints(prev => prev.filter(p => p.id !== id));

  // Prepare unique dates for filter dropdown
  const dates = [...new Set(points.map(p => p.date))];
  // Filter points if a date filter is selected
  const displayPoints = points.filter(p => !filterDate || p.date === filterDate);

  // Fetch and draw route between displayed points via OSRM API
  useEffect(() => {
    if (displayPoints.length < 2) {
      // Keep existing route if not enough points
      return;
    }
    const coords = displayPoints.map(p => `${p.position.lng},${p.position.lat}`).join(';');
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then(res => res.json())
      .then(data => {
        if (data.routes?.length) {
          const geo = data.routes[0].geometry.coordinates;
          // Convert [lng, lat] to [lat, lng] for Leaflet
          setRouteCoords(geo.map(c => [c[1], c[0]]));
        }
      })
      .catch(err => console.error('OSRM error', err));
  }, [displayPoints]);

  return (
    <MainLayout>
      {/* Map display area */}
      <div style={{ height: '450px' }} className="mb-4">
        <MapContainer center={[52.237049, 21.017532]} zoom={6} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Listen for clicks to add points */}
          <LocationSelector onSelect={handleMapClick} />

          {/* Render markers for each point */}
          {displayPoints.map(pt => (
            <Marker key={pt.id} position={[pt.position.lat, pt.position.lng]}> 
              <Popup>
                <strong>{pt.title}</strong><br />{pt.date}
              </Popup>
            </Marker>
          ))}

          {/* Draw route polyline if available */}
          {routeCoords.length > 1 && (
            <Polyline positions={routeCoords} pathOptions={{ color: '#0d6efd', weight: 4 }} />
          )}
        </MapContainer>
      </div>

      {/* Date filter and clear button */}
      <Row className="align-items-center mb-3">
        <Col md={4} className="mb-2">
          <Form.Select value={filterDate} onChange={e => setFilterDate(e.target.value)}>
            <option value="">Wszystkie dni</option>
            {dates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('pl-PL')}</option>)}
          </Form.Select>
        </Col>
        <Col className="text-md-end">
          <Button variant="outline-secondary" size="sm" onClick={() => setFilterDate('')}>Wyczyść filtr</Button>
        </Col>
      </Row>

      {/* Timeline of points */}
      <div className="timeline">
        {displayPoints.length === 0 ? (
          <p className="text-center">Brak punktów na wybrany dzień.</p>
        ) : displayPoints.map((pt, idx) => (
          <div key={pt.id} className="d-flex flex-column align-items-center mb-4">
            {/* Card for each point, dim past dates */}
            <Card className={`shadow-sm w-75 ${new Date(pt.date) < new Date(today) ? 'bg-light text-muted' : ''}`}>
              <Card.Body className="d-flex justify-content-between">
                <div>
                  <h5>{pt.title}</h5>
                  <small className="text-muted">{new Date(pt.date).toLocaleDateString('pl-PL')}</small>
                  <p className="mt-2">{pt.description}</p>
                </div>

                {/* Edit and delete buttons */}
                <div>
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => openEdit(pt)}><BsPencil /></Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemove(pt.id)}><BsTrash /></Button>
                </div>
              </Card.Body>
            </Card>

            {/* Arrow between points */}
            {idx < displayPoints.length - 1 && <BsArrowDown size={24} color="#0d6efd" className="my-2" />}
          </div>
        ))}
      </div>

      {/* Modal for adding/editing points */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingId ? 'Edytuj punkt' : 'Dodaj punkt podróży'}</Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSave}>
          <Modal.Body>
            {/* Position display */}
            <Form.Group className="mb-3">
              <Form.Label>Pozycja</Form.Label>
              <Form.Control type="text" readOnly value={position ? `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}` : ''} />
            </Form.Group>

            {/* Title input with loading spinner */}
            <Form.Group className="mb-3" controlId="formTitle">
              <Form.Label>Nazwa punktu *</Form.Label>
              <InputGroup>
                {loadingName && <Spinner animation="border" size="sm" className="me-2" />}
                <Form.Control type="text" name="title" value={form.title} onChange={handleChange} placeholder={loadingName ? 'Ładowanie nazwy...' : ''} required disabled={loadingName} />
              </InputGroup>
            </Form.Group>

            {/* Date input */}
            <Form.Group className="mb-3" controlId="formDate">
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="date" value={form.date} onChange={handleChange} required min={dates[0] || today} />
            </Form.Group>

            {/* Description textarea */}
            <Form.Group className="mb-3" controlId="formDescription">
              <Form.Label>Opis</Form.Label>
              <Form.Control as="textarea" name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Opcjonalny opis" />
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
