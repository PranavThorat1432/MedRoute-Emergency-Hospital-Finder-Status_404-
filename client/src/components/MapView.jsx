import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet'
import { useEffect, useState } from 'react'
import L from 'leaflet'
import { useNavigate } from 'react-router-dom'
import { getBedStatus } from '../utils/distance'
import { useLang } from '../context/LangContext'
import { formatTravelMinutes } from '../utils/formatTravel'

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createHospitalIcon(status, isEmergency) {
  const colorMap = {
    available: '#10b981',
    limited: '#f59e0b',
    full: '#ef4444',
  }
  const color = colorMap[status] || '#ef4444'
  const border = isEmergency ? '#dc2626' : '#fff'

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:32px; height:32px;
        background:${color};
        border:3px solid ${border};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
      ">
        <span style="
          display:block;
          transform:rotate(45deg);
          text-align:center;
          line-height:26px;
          font-size:14px;
        ">🏥</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -36],
  })
}

function userIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:20px; height:20px;
        background:#3b82f6;
        border:3px solid #fff;
        border-radius:50%;
        box-shadow:0 0 0 4px rgba(59,130,246,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function MapController({ center, navigateTarget, userLocation, hospitals }) {
  const map = useMap()
  
  useEffect(() => {
    if (navigateTarget && userLocation) {
      const bounds = L.latLngBounds(
        [userLocation.lat, userLocation.lng],
        [navigateTarget.lat, navigateTarget.lng]
      )
      map.flyToBounds(bounds, { padding: [80, 80], duration: 1.5 })
    } else if (navigateTarget) {
      map.flyTo([navigateTarget.lat, navigateTarget.lng], 14, { duration: 1.5 })
    } else if (hospitals && hospitals.length > 0 && !userLocation) {
      const bounds = L.latLngBounds(hospitals.map(h => [h.lat, h.lng]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1.5 })
      }
    } else if (center) {
      map.flyTo(center, 14, { duration: 1.5 })
    }
  }, [
    map,
    center ? center[0] : null,
    center ? center[1] : null,
    navigateTarget?.lat,
    navigateTarget?.lng,
    userLocation?.lat,
    userLocation?.lng,
    hospitals?.length
  ])
  
  return null
}

export default function MapView({ hospitals, userLocation, navigateTarget }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const [routePath, setRoutePath] = useState(null)

  useEffect(() => {
    if (userLocation && navigateTarget) {
      const fetchRoute = async () => {
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${navigateTarget.lng},${navigateTarget.lat}?overview=full&geometries=geojson`
          const res = await fetch(url)
          const data = await res.json()
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]])
            setRoutePath(coords)
          }
        } catch (err) {
          console.error("Failed to fetch route", err)
          setRoutePath(null)
        }
      }
      fetchRoute()
    } else {
      setRoutePath(null)
    }
  }, [userLocation, navigateTarget])

  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [21.007, 75.563]

  return (
    <div className="w-full h-[480px] rounded-2xl overflow-hidden shadow-md border border-slate-200">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController 
          center={center}
          navigateTarget={navigateTarget}
          userLocation={userLocation}
          hospitals={hospitals}
        />

        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon()}
          >
            <Popup>
              <div className="text-sm font-semibold text-primary-700">📍 You are here</div>
            </Popup>
          </Marker>
        )}

        {hospitals
          .filter((hospital) => !navigateTarget || (hospital.lat === navigateTarget.lat && hospital.lng === navigateTarget.lng))
          .map((hospital) => {
          const bedStatus = getBedStatus(hospital.beds?.available, hospital.beds?.total)
          return (
            <Marker
              key={hospital._id}
              position={[hospital.lat, hospital.lng]}
              icon={createHospitalIcon(bedStatus, hospital.emergency)}
            >
              <Popup minWidth={220}>
                <div className="font-body">
                  <img
                    src={hospital.image}
                    alt={hospital.name}
                    className="w-full h-28 object-cover rounded-lg mb-2"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div className="font-display font-bold text-slate-800 text-sm mb-1">
                    {hospital.name}
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{hospital.address}</div>
                  <div className="flex gap-2 mb-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      bedStatus === 'available' ? 'bg-emerald-100 text-emerald-700' :
                      bedStatus === 'limited' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      🛏️ {hospital.beds?.available}/{hospital.beds?.total}
                    </span>
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                      💉 ICU {hospital.icu?.available}/{hospital.icu?.total}
                    </span>
                  </div>
                  {hospital.travelDurationSeconds != null && (
                    <div className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mb-3">
                      ⏱ {t('timeToReach')}: {formatTravelMinutes(hospital.travelDurationSeconds)}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/hospital/${hospital._id}`)}
                      className="flex-1 bg-primary-600 text-white text-xs py-1.5 rounded-lg font-semibold hover:bg-primary-700"
                    >
                      {t('viewDetails')}
                    </button>
                    <a
                      href={`tel:${hospital.phone}`}
                      className="flex-1 text-center bg-slate-100 text-slate-700 text-xs py-1.5 rounded-lg font-semibold hover:bg-slate-200"
                    >
                      📞 {t('callHospital')}
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {userLocation && navigateTarget && routePath && (
          <Polyline 
            positions={routePath}
            color="#3b82f6"
            weight={5}
            opacity={0.8}
            lineCap="round"
            lineJoin="round"
          />
        )}
        {userLocation && navigateTarget && !routePath && (
          <Polyline 
            positions={[
              [userLocation.lat, userLocation.lng],
              [navigateTarget.lat, navigateTarget.lng]
            ]}
            color="#94a3b8"
            weight={4}
            dashArray="10, 10"
          />
        )}
      </MapContainer>
    </div>
  )
}
