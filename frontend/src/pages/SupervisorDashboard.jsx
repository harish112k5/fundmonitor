import { SkeletonTable } from '../components/SkeletonCard';
import React, { useEffect, useState } from 'react';
import { PageWrapper, AnimatedItem } from '../components/PageWrapper';
import API from '../api';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineCube,
  HiOutlineCog,
  HiOutlineOfficeBuilding
} from 'react-icons/hi';
import AnimatedKPICard from '../components/AnimatedKPICard';

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ manpower: 0, material: 0, machine: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: myProjects } = await API.get('/projects/my-projects');
        setProjects(myProjects || []);

        if (myProjects && myProjects.length > 0) {
          const pid = myProjects[0].project_id;
          const today = new Date().toISOString().split('T')[0];

          // Fetch today's counts from endpoints (which are restricted to today automatically by middleware)
          const [manRes, matRes, macRes] = await Promise.all([
            API.get(`/manpower-usage?project_id=${pid}&date=${today}`),
            API.get(`/material-usage?project_id=${pid}&date=${today}`),
            API.get(`/machine-usage?project_id=${pid}&date=${today}`),
          ]);

          setStats({
            manpower: manRes.data?.data?.length || manRes.data?.length || 0,
            material: matRes.data?.data?.length || matRes.data?.length || 0,
            machine: macRes.data?.data?.length || macRes.data?.length || 0,
          });
        }
      } catch (err) {
        console.error('Failed to load supervisor data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const todayStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return <div style={{ padding: '24px' }}><SkeletonTable rows={5} /></div>;

  return (
    <PageWrapper>
      <AnimatedItem delay={0}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 24, fontWeight: 700, margin: 0 }}>Daily Site Report</h1>
          <p style={{ color: 'var(--text-accent)', margin: '4px 0 0', fontSize: 14, fontWeight: 500 }}>{todayStr}</p>
        </div>

        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏗️</div>
            <h2>No Site Assigned</h2>
            <p>You have not been assigned to a project yet. Contact your administrator.</p>
          </div>
        ) : (
          <>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
              borderRadius: 12, padding: 20, marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--accent-glow)', color: 'var(--text-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HiOutlineOfficeBuilding size={24} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>My Assigned Site</div>
                <div style={{ fontSize: 20, color: 'var(--text-primary)', fontWeight: 700 }}>{projects[0].project_name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{projects[0].location || 'No Location'}</div>
              </div>
            </div>

            <h2 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 16 }}>Today's Activity</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <AnimatedKPICard index={0} icon={<HiOutlineUsers size={24} />} color="var(--text-secondary)" label="WORKERS TODAY" value={stats.manpower} onClick={() => navigate('/manpower-usage')} subtitle="Attendance logged today" />
              <AnimatedKPICard index={1} icon={<HiOutlineCube size={24} />} color="#F59E0B" label="MATERIAL ENTRIES" value={stats.material} onClick={() => navigate('/material-usage')} subtitle="Deliveries/Usage logged today" />
              <AnimatedKPICard index={2} icon={<HiOutlineCog size={24} />} color="#0284C7" label="MACHINE ENTRIES" value={stats.machine} onClick={() => navigate('/machine-usage')} subtitle="Equipment active today" />
            </div>
          </>
        )}
      </AnimatedItem>
    </PageWrapper>
  );
}
