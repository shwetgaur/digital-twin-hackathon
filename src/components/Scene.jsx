import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';

function Building({ data, position }) {
  const color = data.attributes.has_solar ? 'gold' : 'royalblue';
  return (
    <mesh position={position}>
      <boxGeometry args={[2, 4, 2]} />
      <meshStandardMaterial color={color} />
      <Text position={[0, 2.5, 0]} fontSize={0.5} color="white" anchorX="center">
        {data.id}
      </Text>
    </mesh>
  );
}

function Road({ data, position }) {
  const color = data.attributes.is_bike_lane ? 'lightskyblue' : '#444';
  return (
    <mesh position={position}>
      <boxGeometry args={[2, 0.2, 5]} />
      <meshStandardMaterial color={color} />
       <Text position={[0, 0.5, 0]} fontSize={0.5} color="white" anchorX="center">
        {data.id}
      </Text>
    </mesh>
  );
}

function Scene({ cityData }) {
  useEffect(() => {
    console.log("Scene detected a change in cityData:", cityData);
  }, [cityData]);

  return (
    <Canvas camera={{ position: [10, 15, 15], fov: 60 }}>
      <ambientLight intensity={0.7} />
      <directionalLight position={[20, 30, 10]} intensity={1.5} />
      <OrbitControls />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#555" />
      </mesh>

      {cityData.elements.map((element, index) => {
        const position = [index * 4 - 6, 0, 0];
        if (element.type === 'building') {
          return <Building key={element.id} data={element} position={[...position, 0]} />;
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