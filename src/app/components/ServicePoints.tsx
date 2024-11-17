import React from 'react';

interface ServicePointsProps {
  title: string;
  points: string[];
}

const ServicePoints: React.FC<ServicePointsProps> = ({ title, points }) => {
  return (
    <div className="bg-[#0FA4AF] text-black outline-dashed outline-[#0FA4AF] p-4 rounded-lg shadow-2xl shadow-[#003135] w-1/2 mt-4 mb-10">
      <h2 className="text-xl font-bold text-center mb-4">{title}</h2>
      <div className="flex flex-col mx-3 md:flex-row justify-between space-y-4 md:space-y-0">
        <ul className="list-disc space-y-5 md:w-1/2 md:pl-8">
          {points.slice(0, Math.ceil(points.length / 2)).map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
        <ul className="list-disc space-y-5 md:w-1/2 md:pl-8">
          {points.slice(Math.ceil(points.length / 2)).map((point, index) => (
            <li key={index}>{point}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ServicePoints;
