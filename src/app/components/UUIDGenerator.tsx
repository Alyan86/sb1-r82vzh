'use client';
import { useEffect } from 'react';
import { generateUUID } from '../utils/uuidGenerator';

interface UUIDGeneratorProps {
  onUUIDGenerated: (uuid: string) => void;
}

const UUIDGenerator: React.FC<UUIDGeneratorProps> = ({ onUUIDGenerated }) => {
  useEffect(() => {
    const uuid = generateUUID();
    onUUIDGenerated(uuid);
  }, [onUUIDGenerated]);

  return null;
};

export default UUIDGenerator;
