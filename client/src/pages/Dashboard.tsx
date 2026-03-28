import { Card, Row, Col, Statistic, Typography } from 'antd';
import { Users, Map } from 'lucide-react';

const { Title } = Typography;

const Dashboard = () => {
  return (
    <div style={{ padding: '40px' }}>
      <Title level={2} style={{ marginBottom: '30px' }}>Admissions Dashboard</Title>
      
      <Row gutter={[24, 24]}>
        <Col span={8}>
  <Card 
    variant="borderless" // <--- НОВЫЙ СИНТАКСИС
    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
  >
    <Statistic 
      title="Total Applicants" 
      value={21450} 
      prefix={<Users size={20} style={{ marginRight: '8px', color: '#006CFF' }} />} 
    />
  </Card>
</Col>
        <Col span={8}>
  <Card 
    variant="borderless" // <--- НОВЫЙ СИНТАКСИС
    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
  >
    <Statistic 
      title="Total Applicants" 
      value={21450} 
      prefix={<Users size={20} style={{ marginRight: '8px', color: '#006CFF' }} />} 
    />
  </Card>
</Col>
        <Col span={8}>
  <Card 
    variant="borderless" // <--- НОВЫЙ СИНТАКСИС
    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
  >
    <Statistic 
      title="Total Applicants" 
      value={21450} 
      prefix={<Users size={20} style={{ marginRight: '8px', color: '#006CFF' }} />} 
    />
  </Card>
</Col>
      </Row>

      <Row style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title={<><Map size={18} style={{ marginRight: '8px' }} /> Regional Distribution</>}>
             <div style={{ height: '300px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ color: '#94a3b8' }}>[ Карта Казахстана будет здесь - используй SVG или библиотеку Simple Maps ]</p>
             </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;