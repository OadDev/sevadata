import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "../App";
import { toast } from "sonner";
import {
  PawPrint,
  FirstAid,
  Heartbeat,
  House,
  Syringe,
  TrendUp,
  Warning,
  Users,
  ArrowRight,
  Plus,
  Bell,
  CheckCircle,
  Clock,
  CalendarCheck
} from "@phosphor-icons/react";
import { Button } from "../components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { formatDate } from "../utils/dateFormat";

const Dashboard = () => {
  const { token } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [charts, setCharts] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [metricsRes, chartsRes, notifRes] = await Promise.all([
        axios.get(`${API}/dashboard/metrics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/dashboard/charts`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/notifications/followups`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setMetrics(metricsRes.data);
      setCharts(chartsRes.data);
      setNotifications(notifRes.data);
    } catch (error) {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const markFollowupComplete = async (checkupId) => {
    try {
      await axios.put(`${API}/notifications/followups/${checkupId}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Followup marked as complete");
      fetchData();
    } catch (error) {
      toast.error("Failed to update followup");
    }
  };

  const COLORS = ["#4CAF50", "#1B5E20", "#81C784", "#388E3C", "#A5D6A7", "#2E7D32", "#C8E6C9"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4CAF50] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
            Dashboard
          </h1>
          <p className="text-[#57534E] mt-1">Overview of shelter operations</p>
        </div>
        <Link to="/cases/new">
          <Button 
            className="h-14 px-6 bg-[#4CAF50] hover:bg-[#43A047] text-white font-semibold rounded-lg flex items-center gap-2"
            data-testid="new-case-button"
          >
            <Plus size={22} weight="bold" />
            New Case
          </Button>
        </Link>
      </div>

      {/* Notifications Section */}
      {notifications.length > 0 && (
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={22} className="text-[#F59E0B]" />
            <h3 className="text-lg font-semibold text-[#1C1917]" style={{ fontFamily: 'Manrope' }}>
              Follow-up Reminders ({notifications.length})
            </h3>
          </div>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {notifications.map((notif) => (
              <div 
                key={notif.checkup_id}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 ${
                  notif.urgency === 'overdue' ? 'bg-red-50 border-red-200' :
                  notif.urgency === 'today' ? 'bg-orange-50 border-orange-200' :
                  notif.urgency === 'tomorrow' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-[#F5F5F4] border-[#E7E5E4]'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {notif.urgency === 'overdue' && <Warning size={18} className="text-red-600" />}
                    {notif.urgency === 'today' && <Clock size={18} className="text-orange-600" />}
                    {notif.urgency === 'tomorrow' && <CalendarCheck size={18} className="text-yellow-600" />}
                    <span className={`text-xs font-semibold uppercase ${
                      notif.urgency === 'overdue' ? 'text-red-600' :
                      notif.urgency === 'today' ? 'text-orange-600' :
                      notif.urgency === 'tomorrow' ? 'text-yellow-600' :
                      'text-[#57534E]'
                    }`}>
                      {notif.urgency}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#1C1917] mt-1">
                    {notif.animal_name} <span className="text-[#4CAF50]">({notif.case_number})</span>
                  </p>
                  <p className="text-xs text-[#57534E]">
                    Follow-up: {formatDate(notif.followup_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/cases/${notif.case_id}`}>
                    <Button variant="outline" size="sm" className="h-9">
                      View
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="h-9 bg-[#4CAF50] hover:bg-[#43A047] text-white"
                    onClick={() => markFollowupComplete(notif.checkup_id)}
                    data-testid={`complete-followup-${notif.checkup_id}`}
                  >
                    <CheckCircle size={16} className="mr-1" />
                    Done
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={PawPrint}
          label="Total Cases"
          value={metrics?.cases?.total || 0}
          color="green"
        />
        <StatCard
          icon={Heartbeat}
          label="Active Cases"
          value={metrics?.cases?.total_active || 0}
          trend={`+${metrics?.cases?.new_today || 0} today`}
          color="blue"
        />
        <StatCard
          icon={Warning}
          label="Critical"
          value={metrics?.cases?.critical || 0}
          subValue={`${metrics?.cases?.injured || 0} injured`}
          color="red"
        />
        <StatCard
          icon={Syringe}
          label="Sterilised"
          value={metrics?.sterilisation?.total || 0}
          trend={`+${metrics?.sterilisation?.this_month || 0} this month`}
          color="purple"
        />
        <StatCard
          icon={FirstAid}
          label="Follow-ups Due"
          value={metrics?.medical?.followups_due || 0}
          color="orange"
        />
      </div>

      {/* Shelter Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ShelterCard
          title="SEVA Shelter"
          count={metrics?.shelters?.seva || 0}
          icon={House}
          color="#4CAF50"
        />
        <ShelterCard
          title="Government Shelter"
          count={metrics?.shelters?.govt || 0}
          icon={House}
          color="#1B5E20"
        />
        <ShelterCard
          title="Private Shelter"
          count={metrics?.shelters?.private || 0}
          icon={House}
          color="#81C784"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rescue Trends */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'Manrope' }}>
            Rescue Trends (Last 7 Days)
          </h3>
          <div style={{ width: '100%', height: 256 }}>
            <ResponsiveContainer width="100%" height={256}>
              <BarChart data={charts?.rescue_trends || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#78716C" />
                <YAxis tick={{ fontSize: 12 }} stroke="#78716C" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#4CAF50" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
          <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'Manrope' }}>
            Case Status Distribution
          </h3>
          <div style={{ width: '100%', height: 256 }}>
            <ResponsiveContainer width="100%" height={256}>
              <PieChart>
                <Pie
                  data={charts?.status_distribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts?.status_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {(charts?.status_distribution || []).map((item, index) => (
              <div key={item.status} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-[#57534E]">{item.status}: {item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outcomes Summary */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
        <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'Manrope' }}>
          Outcomes Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <OutcomeItem label="Under Observation" value={metrics?.outcomes?.under_observation || 0} />
          <OutcomeItem label="Released" value={metrics?.outcomes?.released || 0} />
          <OutcomeItem label="Permanent Resident" value={metrics?.outcomes?.permanent_resident || 0} />
          <OutcomeItem label="Adopted" value={metrics?.outcomes?.adopted || 0} color="green" />
          <OutcomeItem label="Deceased" value={metrics?.outcomes?.deceased || 0} color="red" />
        </div>
      </div>

      {/* Sterilisation Stats */}
      <div className="bg-white border border-[#E7E5E4] rounded-lg p-5">
        <h3 className="text-lg font-semibold text-[#1C1917] mb-4" style={{ fontFamily: 'Manrope' }}>
          Sterilisation Statistics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-[#F5F5F4] rounded-lg">
            <p className="text-2xl font-bold text-[#1C1917]">{metrics?.sterilisation?.total || 0}</p>
            <p className="text-sm text-[#57534E]">Total Sterilised</p>
          </div>
          <div className="text-center p-4 bg-[#E8F5E9] rounded-lg">
            <p className="text-2xl font-bold text-[#1B5E20]">{metrics?.sterilisation?.this_month || 0}</p>
            <p className="text-sm text-[#57534E]">This Month</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{metrics?.sterilisation?.male || 0}</p>
            <p className="text-sm text-[#57534E]">Male</p>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <p className="text-2xl font-bold text-pink-700">{metrics?.sterilisation?.female || 0}</p>
            <p className="text-sm text-[#57534E]">Female</p>
          </div>
        </div>
        {metrics?.sterilisation?.pending > 0 && (
          <div className="mt-4 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
            <p className="text-[#92400E] font-medium">
              {metrics?.sterilisation?.pending} cases pending sterilisation
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionCard
          to="/cases?condition=Critical"
          title="View Critical Cases"
          description="Cases requiring immediate attention"
          icon={Warning}
          color="red"
        />
        <QuickActionCard
          to="/cases?sterilisation_status=Pending"
          title="Pending Sterilisation"
          description="Cases waiting for sterilisation"
          icon={Syringe}
          color="orange"
        />
        <QuickActionCard
          to="/cases"
          title="All Cases"
          description="Browse all animal cases"
          icon={PawPrint}
          color="green"
        />
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, trend, subValue, color }) => {
  const colorClasses = {
    green: "bg-[#E8F5E9] text-[#1B5E20]",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700"
  };

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-lg p-4 sm:p-5" data-testid={`stat-card-${label.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon size={24} weight="duotone" />
        </div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-[#1C1917] mt-3">{value}</p>
      <p className="text-sm text-[#57534E] mt-1">{label}</p>
      {trend && <p className="text-xs text-[#4CAF50] mt-1">{trend}</p>}
      {subValue && <p className="text-xs text-[#78716C] mt-1">{subValue}</p>}
    </div>
  );
};

const ShelterCard = ({ title, count, icon: Icon, color }) => (
  <div 
    className="bg-white border border-[#E7E5E4] rounded-lg p-5 flex items-center gap-4"
    data-testid={`shelter-card-${title.toLowerCase().replace(' ', '-')}`}
  >
    <div 
      className="w-12 h-12 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: `${color}20` }}
    >
      <Icon size={24} weight="duotone" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-[#1C1917]">{count}</p>
      <p className="text-sm text-[#57534E]">{title}</p>
    </div>
  </div>
);

const OutcomeItem = ({ label, value, color }) => (
  <div className="text-center">
    <p className={`text-xl font-bold ${color === 'green' ? 'text-[#16A34A]' : color === 'red' ? 'text-[#DC2626]' : 'text-[#1C1917]'}`}>
      {value}
    </p>
    <p className="text-xs text-[#57534E]">{label}</p>
  </div>
);

const QuickActionCard = ({ to, title, description, icon: Icon, color }) => {
  const colorClasses = {
    green: "bg-[#E8F5E9] text-[#1B5E20] hover:bg-[#C8E6C9]",
    red: "bg-red-50 text-red-700 hover:bg-red-100",
    orange: "bg-orange-50 text-orange-700 hover:bg-orange-100"
  };

  return (
    <Link 
      to={to}
      className={`p-5 rounded-lg border border-[#E7E5E4] ${colorClasses[color]} transition-all flex items-center justify-between`}
      data-testid={`quick-action-${title.toLowerCase().replace(' ', '-')}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={24} weight="duotone" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
      <ArrowRight size={20} />
    </Link>
  );
};

export default Dashboard;
