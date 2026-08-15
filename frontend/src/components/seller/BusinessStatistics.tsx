'use client';

interface BusinessStatisticsProps {
  totalProducts?: number;
  happyClients?: number;
  yearsExperience?: number;
  ordersCompleted?: number;
  responseTimeMinutes?: number;
  repeatBuyersPercentage?: number;
  averageRating?: number;
}

export default function BusinessStatistics({
  totalProducts = 0,
  happyClients = 0,
  yearsExperience = 0,
  ordersCompleted = 0,
  responseTimeMinutes = 0,
  repeatBuyersPercentage = 0,
  averageRating = 0,
}: BusinessStatisticsProps) {
  const formatResponseTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)}d`;
  };

  const stats = [
    {
      icon: '📦',
      label: 'Total Products',
      value: totalProducts.toLocaleString(),
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      icon: '😊',
      label: 'Happy Clients',
      value: happyClients.toLocaleString(),
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      icon: '⭐',
      label: 'Years Experience',
      value: `${yearsExperience}+`,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      icon: '✅',
      label: 'Orders Completed',
      value: ordersCompleted.toLocaleString(),
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      icon: '⚡',
      label: 'Avg Response',
      value: formatResponseTime(responseTimeMinutes),
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    },
    {
      icon: '🔄',
      label: 'Repeat Buyers',
      value: `${repeatBuyersPercentage}%`,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      borderColor: 'border-pink-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📊 Business Statistics</h2>
        <p className="text-gray-600 mt-2">Professional metrics & key performance indicators</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className={`${stat.bgColor} border-2 ${stat.borderColor} rounded-2xl p-6 hover:shadow-xl transition-shadow`}
          >
            {/* Icon + Label */}
            <div className="flex items-start justify-between mb-4">
              <div className="text-4xl">{stat.icon}</div>
              <div className={`bg-gradient-to-br ${stat.color} text-white rounded-lg p-2`}>
                <span className="text-xs font-bold">Top</span>
              </div>
            </div>

            {/* Value */}
            <div className="mb-2">
              <div className={`text-4xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
            </div>

            {/* Label */}
            <p className="text-sm text-gray-600 font-semibold">{stat.label}</p>

            {/* Trend Indicator */}
            <div className="mt-4 pt-4 border-t border-gray-300 border-opacity-50">
              <p className="text-xs text-gray-500">📈 Trending up</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Rating */}
          <div>
            <p className="text-blue-100 font-semibold mb-3">Overall Rating</p>
            <div className="space-y-2">
              <div className="text-5xl font-black">{averageRating.toFixed(1)}</div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(averageRating) ? '⭐' : '☆'}>
                  </span>
                ))}
              </div>
              <p className="text-blue-100 text-sm">Based on customer reviews</p>
            </div>
          </div>

          {/* Right: Summary Text */}
          <div className="flex flex-col justify-center">
            <h3 className="text-xl font-bold mb-4">Why Choose Us?</h3>
            <ul className="space-y-3 text-blue-50">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Trusted by thousands of buyers</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Fast response time & excellent service</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>High repeat customer rate</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span>Quality products & competitive pricing</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div className="bg-gray-50 rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4">🏆 Achievements & Milestones</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { emoji: '🥇', label: 'Top Seller' },
            { emoji: '⭐', label: 'Highly Rated' },
            { emoji: '⚡', label: 'Fast Shipper' },
            { emoji: '💯', label: '100% Positive' },
            { emoji: '🎯', label: 'Quality Assured' },
            { emoji: '🔒', label: 'Trusted' },
          ].map((badge, idx) => (
            <div key={idx} className="text-center p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition">
              <div className="text-3xl mb-2">{badge.emoji}</div>
              <p className="text-xs font-bold text-gray-900">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-6">📈 Performance Metrics</h3>
        <div className="space-y-6">
          {/* Order Fulfillment */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">Order Fulfillment Rate</p>
              <span className="text-lg font-black text-green-600">98%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 h-full" style={{ width: '98%' }} />
            </div>
          </div>

          {/* Customer Satisfaction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">Customer Satisfaction</p>
              <span className="text-lg font-black text-blue-600">95%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full" style={{ width: '95%' }} />
            </div>
          </div>

          {/* Product Quality */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">Product Quality Rating</p>
              <span className="text-lg font-black text-purple-600">4.8/5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-full" style={{ width: '96%' }} />
            </div>
          </div>

          {/* Delivery Performance */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-gray-900">On-Time Delivery</p>
              <span className="text-lg font-black text-orange-600">92%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-full" style={{ width: '92%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
