import React from 'react';
import CountUp from 'react-countup';

const MemberCount: React.FC = () => {
  const randomMemberCount = Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="bg-[#003135] w-1/2 h-16 rounded-full shadow-[#0FA4AF] shadow-lg flex items-center justify-center mb-5">
      <div className="font-semibold text-center">
        <h2 className="text-xl">Member Count</h2>
        <h2 className="text-base">
          <CountUp start={0} end={randomMemberCount} duration={3} separator="," />+
        </h2>
      </div>
    </div>
  );
};

export default MemberCount;
