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
        message.success('Welcome to InVision U!');
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
    <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#F8FAFC' }}>
      <Card 
        style={{ 
          width: 420, 
          borderRadius: 24, 
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          padding: '20px' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: '40px', height: '40px',
            background: '#006CFF',
            borderRadius: '10px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold'
          }}>N</div>
          <Title level={3} style={{ margin: 0 }}>Candidate Login</Title>
          <Text type="secondary">Enter your email and the password we provided</Text>
        </div>

        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item 
            name="email" 
            rules={[{ required: true, type: 'email', message: 'Please enter your email' }]}
          >
            <Input prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} placeholder="Email address" />
          </Form.Item>

          <Form.Item 
            name="password" 
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: '#bfbfbf' }} />} placeholder="Temporary password" />
          </Form.Item>

          <Button 
            type="primary" 
            htmlType="submit" 
            block 
            loading={loading}
            icon={<ArrowRightOutlined />}
            style={{ 
              height: 48, 
              borderRadius: 12, 
              background: '#006CFF', 
              marginTop: 10,
              fontWeight: 600 
            }}
          >
            Sign In
          </Button>
        </Form>
        
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Text type="secondary">Haven't applied yet? </Text>
          <Button type="link" onClick={() => navigate('/apply')} style={{ padding: 0 }}>Apply Now</Button>
        </div>
      </Card>
    </Layout>
  );
};

export default Login;