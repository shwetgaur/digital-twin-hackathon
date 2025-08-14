import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';

// A reusable component for our buildings
function Building({ data, position }) {
  const color = data.attributes.has_solar ? 'gold' : 'royalblue';
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2, 4, 2]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.5} />
      </mesh>
      <Text position={[0, 2.5, 0]} fontSize={0.4} color="white" anchorX="center">
        {data.id}
      </Text>
    </group>
  );
}

// A reusable component for our roads
function Road({ data, position }) {
  const color = data.attributes.is_bike_lane ? 'lightskyblue' : '#444';
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[2, 0.2, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Scene({ cityData }) {
  return (
    <Canvas camera={{ position: [0, 15, 20], fov: 60 }}>
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 5]} intensity={1} />
      <OrbitControls />

      {cityData.elements.map((element, index) => {
        const position = [index * 4 - (cityData.elements.length * 2), 2, 0];
        if (element.type === 'building') {
          return <Building key={element.id} data={element} position={position} />;
        }
        if (element.type === 'road') {
          return <Road key={element.id} data={element} position={[...position, 5]} />;
        }
        return null;
      })}
    </Canvas>
  );
}

export default Scene;