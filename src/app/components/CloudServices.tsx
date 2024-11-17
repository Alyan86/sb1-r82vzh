import React from 'react';

interface CloudService {
  name: string;
  logo: string;
}

interface CloudServicesProps {
  services: CloudService[];
}

const CloudServices: React.FC<CloudServicesProps> = ({ services }) => {
  const handleClick = (serviceName: string) => {
    alert(`You clicked on ${serviceName}`);
  };

  return (
    <div className="w-full mt-4 p-4 bg-[#0FA4AF] shadow-2xl shadow-[#003135] rounded-2xl text-center">
      <h2 className="text-2xl font-bold mb-2">Cloud Storage Services Supported by EpicBytes</h2>
      <p className="text-lg mb-4">EpicBytes supports 30 cloud services all over the world.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-5">
        {services.map((service, index) => (
          <div
            key={index}
            className="p-4 bg-[#AFDDE5] rounded-lg shadow-lg shadow-[#003135] cursor-pointer hover:outline-none hover:outline-[#024950]"
            onClick={() => handleClick(service.name)}
          >
            <img src={service.logo} alt={service.name} className="h-16 w-full object-contain mb-2" />
            <p className="text-md font-semibold">{service.name}</p>
          </div>
        ))}
      </div>
      <p className="text-xs mb-4">Didn't find your cloud service? Feel free to contact: support@epicbytes.me</p>
    </div>
  );
};

export default CloudServices;
