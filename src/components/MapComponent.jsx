import React, { useState } from 'react';
import Map, { Source, Layer, Popup } from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const MapComponent = ({ data }) => {
  const [viewState, setViewState] = useState({
    longitude: 73.8987,
    latitude: 18.5391,
    zoom: 14.5,
    pitch: 50,
    bearing: -20,
  });
  
  const [hoverInfo, setHoverInfo] = useState(null);

  const onHover = (event) => {
    const { features, point: {x, y} } = event;
    const hoveredFeature = features && features[0];
    setHoverInfo(hoveredFeature ? { feature: hoveredFeature, x, y } : null);
  };
  
  const onMouseOut = () => setHoverInfo(null);

  return (
    <div className="map-container">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={`https://api.maptiler.com/maps/streets-v2-dark/style.json?key=${MAPTILER_API_KEY}`}
        mapLib={maplibregl}
        interactiveLayerIds={['buildings-layer', 'roads-layer']}
        onMouseMove={onHover}
        onMouseOut={onMouseOut}
      >
        {/* All your data layers will go here */}
        <Source id="aoi" type="geojson" data={data.aoi}><Layer id="aoi-layer" type="line" paint={{'line-color': '#00BFFF', 'line-width': 3}}/></Source>
        <Source id="water-poly" type="geojson" data={data.waterPoly}><Layer id="water-poly-layer" type="fill" paint={{'fill-color': '#2a3e59', 'fill-opacity': 0.8}}/></Source>
        <Source id="greens" type="geojson" data={data.greens}><Layer id="greens-layer" type="fill" paint={{'fill-color': '#2C5F2D', 'fill-opacity': 0.6}}/></Source>
        <Source id="roads" type="geojson" data={data.roads}><Layer id="roads-layer" type="line" paint={{'line-color': '#666', 'line-width': 2}}/></Source>
        <Source id="transit" type="geojson" data={data.transit}><Layer id="transit-layer" type="line" paint={{'line-color': '#FF6F61', 'line-width': 4}}/></Source>
        <Source id="buildings" type="geojson" data={data.buildings}>
          <Layer id="buildings-layer" type="fill-extrusion" paint={{
            'fill-extrusion-color': [
                'interpolate', ['linear'], ['get', 'carbon_emission'],
                40, '#00FF00', // Low emission - Green
                85, '#FFA500', // Medium emission - Orange
                130, '#FF0000' // High emission - Red
            ],
            'fill-extrusion-height': ['/',['get', 'area_m2'], 50],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85
          }}/>
        </Source>
        <Source id="trees" type="geojson" data={data.trees}>
            <Layer id="trees-layer" type="circle" paint={{
                'circle-radius': 3,
                'circle-color': ['case', ['==', ['get', 'simulated'], true], '#90EE90', '#3CB371'],
                'circle-stroke-width': 1,
                'circle-stroke-color': '#fff'
            }} />
        </Source>
        
        {hoverInfo && (
          <div className="tooltip" style={{ left: hoverInfo.x, top: hoverInfo.y }}>
             <div><strong>Layer:</strong> {hoverInfo.feature.layer.id.replace('-layer', '')}</div>
             {Object.entries(hoverInfo.feature.properties).map(([key, value]) => (
                 <div key={key}><strong>{key}:</strong> {value}</div>
             ))}
          </div>
        )}

      </Map>
    </div>
  );
};

export default MapComponent;