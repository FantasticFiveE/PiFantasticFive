import React, { useState } from 'react';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  FaUsers, FaMoneyBillWave,
  FaBriefcase, FaChartPie
} from 'react-icons/fa';
import SectionHeader from "../SectionHeader";

const AdminClustering = () => {
  const [clusters, setClusters] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchClusterData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('http://192.168.1.24:3001/cluster');
      setClusters(response.data.clusters || []);
      setCandidates(response.data.candidates || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Clustering error:', err);
      setError(err.response?.data?.error || 'Failed to cluster candidates');
    } finally {
      setLoading(false);
    }
  };

  const formatSalary = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const prepareChartData = () => {
    if (!clusters.length) return [];

    return clusters.map(cluster => ({
      name: `Cluster ${cluster.cluster + 1}`,
      candidates: cluster.count,
      avgSalary: cluster.avg_salary,
      avgExperience: cluster.avg_experience
    }));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <SectionHeader
          title="Candidate Clustering"
          description="Group similar candidates for better recruitment strategies"
          viewAllPath="/dashboard/manage-clusters"
        />

        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              {lastUpdated && (
                <span className="text-sm text-gray-500">
                  Last updated: {lastUpdated.toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={fetchClusterData}
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium flex items-center space-x-2 transition-all
                ${loading ? 
                  'bg-indigo-400 cursor-not-allowed text-white' : 
                  'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <FaChartPie className="text-white" />
                  <span>Run Clustering Analysis</span>
                </>
              )}
            </button>
          </div>

          {clusters.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <FaUsers size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {clusters.reduce((sum, cluster) => sum + cluster.count, 0)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-xl shadow-sm border border-green-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <FaMoneyBillWave size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Average Desired Salary</p>
                      <p className="text-2xl font-bold text-gray-800">
                        {formatSalary(
                          clusters.reduce((sum, cluster) => sum + cluster.avg_salary, 0) / clusters.length
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-6 rounded-xl shadow-sm border border-purple-100">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <FaBriefcase size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Clusters Created</p>
                      <p className="text-2xl font-bold text-gray-800">{clusters.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-800">Cluster Distribution</h2>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={prepareChartData()}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#6366F1" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '0.5rem',
                          borderColor: '#e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="candidates" 
                        name="Candidates" 
                        fill="#6366F1" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="avgSalary" 
                        name="Avg Salary" 
                        fill="#10B981" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {clusters.map((cluster, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                      <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                        <span className={`text-${['indigo', 'blue', 'purple', 'violet'][index % 4]}-600`}>{`Cluster ${cluster.cluster + 1}`}</span>
                        <span className="text-gray-500 ml-2 text-sm font-normal">({cluster.count} candidates)</span>
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Salary</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {formatSalary(cluster.avg_salary)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Experience</p>
                          <p className="text-lg font-semibold text-gray-800 mt-1">
                            {cluster.avg_experience} years
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminClustering;