import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Layout } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // Ищем кандидата по email
      const res = await axios.get(`http://localhost:5000/api/candidates?search=${values.email}`);
      const user = res.data.find((c: any) => c.email === values.email);

      if (user && user.password === values.password) {
        message.success('Welcome to IinVision U!');
        localStorage.setItem('userEmail', values.email);
        navigate('/status');
      } else {
        message.error('Invalid email or password. Please check your temporary password.');
      }
    } catch (err) {
      message.error('Connection error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(160deg, #fafafa 0%, #f0f4e8 100%)' }}>
      <div style={{ animation: 'fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) both' }}>
      <Card 
        style={{ 
          width: '100%',
          maxWidth: 440, 
          borderRadius: 24, 
          boxShadow: '0 24px 64px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
          padding: '28px 24px',
          background: '#ffffff',
          border: 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: '48px', height: '48px',
            background: '#c1f11d',
            borderRadius: '14px', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#141414', fontWeight: 'bold', fontSize: '20px',
            fontFamily: "'Raleway', sans-serif",
            boxShadow: '0 4px 20px rgba(193, 241, 29, 0.3)',
          }}>iU</div>
          <Title level={3} style={{ margin: '0 0 4px', color: '#1E293B', fontFamily: "'Raleway', sans-serif" }}>Candidate Login</Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>Enter your email and the password we provided</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item 
            name="email" 
            rules={[{ required: true, type: 'email', message: 'Please enter your email' }]}
          >
            <Input 
              prefix={<MailOutlined style={{ color: '#94A3B8' }} />} 
              placeholder="Email address" 
              style={{ 
                background: '#f8f9fa', 
                border: '1px solid #E2E8F0', 
                borderRadius: 12,
                color: '#1E293B',
                height: 50,
              }}
            />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#94A3B8' }} />} 
              placeholder="Temporary password"
              style={{ 
                background: '#f8f9fa', 
                border: '1px solid #E2E8F0', 
                borderRadius: 12,
                color: '#1E293B',
                height: 50,
              }}
            />
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
            icon={<ArrowRightOutlined />}
            style={{ 
              height: 50, 
              borderRadius: 14, 
              background: '#c1f11d', 
              color: '#141414',
              border: 'none',
              marginTop: 12,
              fontWeight: 700,
              fontFamily: "'Raleway', sans-serif",
              fontSize: '15px',
              letterSpacing: '0.02em',
              boxShadow: '0 4px 16px rgba(193, 241, 29, 0.3)',
            }}
          >
            Sign In
          </Button>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Haven't applied yet? </Text>
          <Button type="link" onClick={() => navigate('/apply')} style={{ padding: 0, color: '#65a30d', fontWeight: 600, fontSize: 13 }}>Apply Now</Button>
        </div>
      </Card>
      </div>
    </Layout>
  );
};

export default Login;