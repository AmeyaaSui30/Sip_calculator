import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// SIP Calculation Utilities
const sipUtils = {
  calculateNormalSIP: (monthlyInvestment, annualReturn, years) => {
    const monthlyRate = annualReturn / 12 / 100;
    const months = years * 12;

    if (monthlyRate === 0) {
      return monthlyInvestment * months;
    }

    const futureValue = monthlyInvestment * 
      (Math.pow(1 + monthlyRate, months) - 1) / 
      monthlyRate * 
      (1 + monthlyRate);

    return futureValue;
  },

  calculateStepUpSIP: (monthlyInvestment, annualReturn, years, stepUpPercent) => {
    const monthlyRate = annualReturn / 12 / 100;
    let totalValue = 0;
    let currentMonthlyInvestment = monthlyInvestment;

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        totalValue = (totalValue + currentMonthlyInvestment) * (1 + monthlyRate);
      }
      currentMonthlyInvestment *= (1 + stepUpPercent / 100);
    }

    return totalValue;
  },

  calculateInflationAdjusted: (futureValue, inflationRate, years) => {
    return futureValue / Math.pow(1 + inflationRate / 100, years);
  },

  generateYearlyBreakdown: (monthlyInvestment, annualReturn, years, stepUpPercent) => {
    const monthlyRate = annualReturn / 12 / 100;
    const breakdown = [];
    let totalValue = 0;
    let currentMonthlyInvestment = monthlyInvestment;
    let totalInvested = 0;

    for (let year = 1; year <= years; year++) {
      let yearlyInvestment = 0;

      for (let month = 1; month <= 12; month++) {
        totalValue = (totalValue + currentMonthlyInvestment) * (1 + monthlyRate);
        yearlyInvestment += currentMonthlyInvestment;
        totalInvested += currentMonthlyInvestment;
      }

      breakdown.push({
        year,
        monthlyInvestment: Math.round(currentMonthlyInvestment),
        yearlyInvestment: Math.round(yearlyInvestment),
        totalInvested: Math.round(totalInvested),
        yearEndValue: Math.round(totalValue),
        returns: Math.round(totalValue - totalInvested)
      });

      currentMonthlyInvestment *= (1 + stepUpPercent / 100);
    }

    return breakdown;
  },

  generateChartData: (monthlyInvestment, annualReturn, years, stepUpPercent) => {
    const data = [];
    const monthlyRate = annualReturn / 12 / 100;

    let normalValue = 0;
    let stepUpValue = 0;
    let stepUpMonthly = monthlyInvestment;

    for (let year = 1; year <= years; year++) {
      for (let month = 1; month <= 12; month++) {
        normalValue = (normalValue + monthlyInvestment) * (1 + monthlyRate);
        stepUpValue = (stepUpValue + stepUpMonthly) * (1 + monthlyRate);
      }

      if (year % Math.max(1, Math.floor(years / 10)) === 0 || year === years) {
        data.push({
          year,
          'Normal SIP': Math.round(normalValue),
          'Step-Up SIP': Math.round(stepUpValue)
        });
      }

      stepUpMonthly *= (1 + stepUpPercent / 100);
    }

    return data;
  }
};

const SIPCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [annualReturn, setAnnualReturn] = useState(12);
  const [duration, setDuration] = useState(10);
  const [stepUpPercent, setStepUpPercent] = useState(10);
  const [inflationRate, setInflationRate] = useState(6);

  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [yearlyBreakdown, setYearlyBreakdown] = useState([]);

  useEffect(() => {
    const normalSIP = sipUtils.calculateNormalSIP(monthlyInvestment, annualReturn, duration);
    const stepUpSIP = sipUtils.calculateStepUpSIP(monthlyInvestment, annualReturn, duration, stepUpPercent);

    const normalTotalInvested = monthlyInvestment * duration * 12;

    // Compute present value (inflation-adjusted) of contributions so comparisons are in same units
    const months = duration * 12;
    let normalTotalInvestedPV = 0;
    for (let m = 0; m < months; m++) {
      // assume first contribution at time 0, then each month after
      normalTotalInvestedPV += monthlyInvestment / Math.pow(1 + inflationRate / 100, m / 12);
    }

    let stepUpTotalInvested = 0;
    let currentMonthly = monthlyInvestment;
    let stepUpTotalInvestedPV = 0;
    for (let year = 1; year <= duration; year++) {
      for (let month = 1; month <= 12; month++) {
        stepUpTotalInvested += currentMonthly;
        const monthIndex = (year - 1) * 12 + (month - 1);
        stepUpTotalInvestedPV += currentMonthly / Math.pow(1 + inflationRate / 100, monthIndex / 12);
      }
      currentMonthly *= (1 + stepUpPercent / 100);
    }

    // Calculate inflation-adjusted future values (discount nominal FV back to present)
    const normalInflationAdjusted = sipUtils.calculateInflationAdjusted(normalSIP, inflationRate, duration);
    const stepUpInflationAdjusted = sipUtils.calculateInflationAdjusted(stepUpSIP, inflationRate, duration);

    setResults({
      normal: {
        futureValue: normalSIP,
        totalInvested: normalTotalInvested,
        totalInvestedInflationAdjusted: Math.round(normalTotalInvestedPV),
        returns: normalSIP - normalTotalInvested,
        inflationAdjusted: normalInflationAdjusted,
        realReturns: Math.round(normalInflationAdjusted - normalTotalInvestedPV)
      },
      stepUp: {
        futureValue: stepUpSIP,
        totalInvested: stepUpTotalInvested,
        totalInvestedInflationAdjusted: Math.round(stepUpTotalInvestedPV),
        returns: stepUpSIP - stepUpTotalInvested,
        inflationAdjusted: stepUpInflationAdjusted,
        realReturns: Math.round(stepUpInflationAdjusted - stepUpTotalInvestedPV)
      }
    });

    setChartData(sipUtils.generateChartData(monthlyInvestment, annualReturn, duration, stepUpPercent));
    setYearlyBreakdown(sipUtils.generateYearlyBreakdown(monthlyInvestment, annualReturn, duration, stepUpPercent));
  }, [monthlyInvestment, annualReturn, duration, stepUpPercent, inflationRate]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const InputSlider = ({ label, value, onChange, min, max, step, unit = '' }) => (
    <div className="mb-8">
      <div className="flex justify-between items-baseline mb-3">
        <label className="text-sm font-medium text-[#2B2B2B]">{label}</label>
        <div className="flex items-baseline gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            className="w-24 px-3 py-1 text-right border border-[#D9CDB8] rounded bg-white/50 text-[#2B2B2B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#004225]/30 transition-all"
          />
          <span className="text-sm text-[#846C5B]">{unit}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-[#D9CDB8] rounded-lg appearance-none cursor-pointer slider-thumb"
        style={{
          background: `linear-gradient(to right, #004225 0%, #004225 ${((value - min) / (max - min)) * 100}%, #D9CDB8 ${((value - min) / (max - min)) * 100}%, #D9CDB8 100%)`
        }}
      />
      <div className="flex justify-between mt-1">
        <span className="text-xs text-[#846C5B]">{min}{unit}</span>
        <span className="text-xs text-[#846C5B]">{max}{unit}</span>
      </div>
    </div>
  );

  // Download yearly breakdown as CSV (table-only)
  const downloadYearlyCSV = () => {
    if (!yearlyBreakdown || yearlyBreakdown.length === 0) return;

    const headers = ['Year', 'Monthly SIP', 'Yearly Investment', 'Total Invested', 'Year-End Value', 'Returns'];
    const rows = yearlyBreakdown.map((r) => [
      r.year,
      r.monthlyInvestment,
      r.yearlyInvestment,
      r.totalInvested,
      r.yearEndValue,
      r.returns
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = `yearly_breakdown_${monthlyInvestment}x${duration}y.csv`;
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#FFFAF1] py-8 px-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap');
        
        * {
          font-family: 'Inter', sans-serif;
        }
        
        h1, h2, h3 {
          font-family: 'Playfair Display', serif;
        }
        
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #004225;
          cursor: pointer;
          border: 3px solid #FFFAF1;
          box-shadow: 0 2px 6px rgba(0,66,37,0.3);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0,66,37,0.4);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #004225;
          cursor: pointer;
          border: 3px solid #FFFAF1;
          box-shadow: 0 2px 6px rgba(0,66,37,0.3);
          transition: all 0.2s ease;
        }
        
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 3px 8px rgba(0,66,37,0.4);
        }
      `}</style>
      
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#004225] mb-3">
            SIP Investment Calculator
          </h1>
          <p className="text-[#846C5B] text-sm md:text-base">
            Plan your wealth with systematic investment planning
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border-2 border-[#846C5B]/30 p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-[#004225] mb-6 pb-3 border-b-2 border-[#D9CDB8]">
                Investment Parameters
              </h2>
              
              <InputSlider
                label="Monthly Investment"
                value={monthlyInvestment}
                onChange={setMonthlyInvestment}
                min={500}
                max={100000}
                step={500}
                unit="₹"
              />
              
              <InputSlider
                label="Expected Annual Return"
                value={annualReturn}
                onChange={setAnnualReturn}
                min={1}
                max={30}
                step={0.5}
                unit="%"
              />
              
              <InputSlider
                label="Investment Duration"
                value={duration}
                onChange={setDuration}
                min={1}
                max={40}
                step={1}
                unit="years"
              />
              
              <InputSlider
                label="Annual Step-Up"
                value={stepUpPercent}
                onChange={setStepUpPercent}
                min={0}
                max={30}
                step={1}
                unit="%"
              />
              
              <InputSlider
                label="Expected Inflation Rate"
                value={inflationRate}
                onChange={setInflationRate}
                min={0}
                max={15}
                step={0.5}
                unit="%"
              />
            </div>
          </div>
          
          {/* Results & Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* Results Cards */}
            {results && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Normal SIP */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border-2 border-[#846C5B]/30 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <h3 className="text-xl font-semibold text-[#004225] mb-4">Normal SIP</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Future Value</span>
                      <span className="text-lg font-bold text-[#004225]">
                        {formatCurrency(results.normal.futureValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Total Invested</span>
                      <span className="text-base font-semibold text-[#2B2B2B]">
                        {formatCurrency(results.normal.totalInvested)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Total Returns</span>
                      <span className="text-base font-semibold text-[#004225]">
                        {formatCurrency(results.normal.returns)}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-[#846C5B]/40 bg-[#004225]/5 -mx-6 px-6 py-3 rounded-b-lg">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs text-[#846C5B] font-medium">Real Value (After Inflation)</span>
                        <span className="text-base font-bold text-[#004225]">
                          {formatCurrency(results.normal.inflationAdjusted)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-[#846C5B]">Real Returns</span>
                        <span className="text-sm font-semibold text-[#2B2B2B]">
                          {formatCurrency(results.normal.realReturns)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Step-Up SIP */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg border-2 border-[#004225]/40 p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 ring-2 ring-[#004225]/20">
                  <h3 className="text-xl font-semibold text-[#004225] mb-4">Step-Up SIP</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Future Value</span>
                      <span className="text-lg font-bold text-[#004225]">
                        {formatCurrency(results.stepUp.futureValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Total Invested</span>
                      <span className="text-base font-semibold text-[#2B2B2B]">
                        {formatCurrency(results.stepUp.totalInvested)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pb-2 border-b border-[#D9CDB8]">
                      <span className="text-sm text-[#846C5B]">Total Returns</span>
                      <span className="text-base font-semibold text-[#004225]">
                        {formatCurrency(results.stepUp.returns)}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t-2 border-[#004225]/40 bg-[#004225]/10 -mx-6 px-6 py-3 rounded-b-lg">
                      <div className="flex justify-between items-baseline mb-2">
                        <span className="text-xs text-[#846C5B] font-medium">Real Value (After Inflation)</span>
                        <span className="text-base font-bold text-[#004225]">
                          {formatCurrency(results.stepUp.inflationAdjusted)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-[#846C5B]">Real Returns</span>
                        <span className="text-sm font-semibold text-[#2B2B2B]">
                          {formatCurrency(results.stepUp.realReturns)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#004225]/20">
                    <p className="text-xs text-[#004225] font-medium">
                      Additional gain: {formatCurrency(results.stepUp.futureValue - results.normal.futureValue)}
                    </p>
                    <p className="text-xs text-[#846C5B] mt-1">
                      Real value gain: {formatCurrency(results.stepUp.inflationAdjusted - results.normal.inflationAdjusted)}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Chart */}
            <div className="bg-white/60 backdrop-blur-sm rounded-lg border-2 border-[#846C5B]/30 p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-[#004225] mb-4">Growth Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#D9CDB8" />
                  <XAxis 
                    dataKey="year" 
                    stroke="#846C5B"
                    label={{ value: 'Years', position: 'insideBottom', offset: -5, fill: '#846C5B' }}
                  />
                  <YAxis 
                    stroke="#846C5B"
                    tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      backgroundColor: '#FFFAF1', 
                      border: '2px solid #846C5B',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Normal SIP" 
                    stroke="#846C5B" 
                    strokeWidth={2}
                    dot={{ fill: '#846C5B', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Step-Up SIP" 
                    stroke="#004225" 
                    strokeWidth={3}
                    dot={{ fill: '#004225', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Download Button */}
            <div className="text-center">
              <button onClick={downloadYearlyCSV} className="bg-[#004225] text-[#FFFAF1] px-8 py-3 rounded-lg font-semibold hover:bg-[#005530] transition-colors duration-300 shadow-md hover:shadow-lg">
                Download Yearly Breakdown CSV
              </button>
            </div>
          </div>
        </div>
        
        {/* Yearly Breakdown Table */}
        <div className="mt-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg border-2 border-[#846C5B]/30 p-6 shadow-lg">
            <h2 className="text-2xl font-semibold text-[#004225] mb-6 pb-3 border-b-2 border-[#D9CDB8]">
              Year-wise Investment Breakdown
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#846C5B]">
                    <th className="text-left py-3 px-4 text-[#004225] font-semibold">Year</th>
                    <th className="text-right py-3 px-4 text-[#004225] font-semibold">Monthly SIP</th>
                    <th className="text-right py-3 px-4 text-[#004225] font-semibold">Yearly Investment</th>
                    <th className="text-right py-3 px-4 text-[#004225] font-semibold">Total Invested</th>
                    <th className="text-right py-3 px-4 text-[#004225] font-semibold">Year-End Value</th>
                    <th className="text-right py-3 px-4 text-[#004225] font-semibold">Returns</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyBreakdown.map((row, idx) => (
                    <tr 
                      key={row.year} 
                      className={`border-b border-[#D9CDB8] hover:bg-[#004225]/5 transition-colors ${
                        idx % 2 === 0 ? 'bg-white/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-[#2B2B2B]">{row.year}</td>
                      <td className="py-3 px-4 text-right text-[#2B2B2B]">
                        {formatCurrency(row.monthlyInvestment)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#2B2B2B]">
                        {formatCurrency(row.yearlyInvestment)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[#2B2B2B]">
                        {formatCurrency(row.totalInvested)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#004225]">
                        {formatCurrency(row.yearEndValue)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#004225]">
                        {formatCurrency(row.returns)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPCalculator;
