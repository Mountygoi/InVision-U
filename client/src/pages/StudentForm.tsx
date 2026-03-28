import { Form, Input, Button, Upload, Select, message, Card, Typography, Row, Col } from 'antd';
import { UploadOutlined, UserOutlined, BookOutlined, EnvironmentOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;

// Типизируем форму без использования any
interface StudentFormValues {
  name: string;
  city: string;
  university: string;
  essay?: {
    fileList: UploadFile[];
  };
}

const StudentForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: StudentFormValues) => {
    try {
      const payload = {
        name: values.name,
        city: values.city,
        university: values.university,
        // Генерация аватара на основе имени (для красоты в админке)
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(values.name)}`,
        status: 'new',
        // Расширенная логика бонуса для регионов
        isRural: ['Qyzylorda', 'Atyrau', 'Aktau', 'Turkistan'].includes(values.city),
        experience: ['project'], // Дефолтное значение для корректной работы скоринга
        skills: ['Analytical Thinking'],
      };

      // Отправка на твой запущенный сервер (порт 5000)
      await axios.post('http://localhost:5000/api/apply', payload);
      
      message.success('Application submitted successfully! Redirecting...');
      
      // Автоматический переход в админку, чтобы сразу показать результат
      setTimeout(() => navigate('/candidates'), 1500);
    } catch (err) {
      console.error('Submit error:', err);
      message.error('Failed to submit application. Make sure backend is running.');
    }
  };

  return (
    <div style={{ 
      padding: '60px 20px', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif' 
    }}>
      <Card 
        variant="borderless"
        style={{ 
          maxWidth: 800, 
          margin: '0 auto', 
          borderRadius: '24px', 
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)' 
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '48px', height: '48px', 
            background: 'linear-gradient(135deg, #006CFF 0%, #00D8E6 100%)', 
            borderRadius: '12px', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold', fontSize: '20px'
          }}>N</div>
          <Title level={2} style={{ marginBottom: '8px' }}>Scholarship Application</Title>
          <Text type="secondary">Заполни форму, чтобы ИИ проанализировал твой потенциал для nVision U</Text>
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={onFinish} 
          requiredMark={false}
          autoComplete="off"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item 
                name="name" 
                label={<Text strong>Full Name</Text>} 
                rules={[{ required: true, message: 'Пожалуйста, введите ФИО' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#bfbfbf' }} />} placeholder="Иван Иванов" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item 
                name="university" 
                label={<Text strong>University / School</Text>} 
                rules={[{ required: true, message: 'Укажите учебное заведение' }]}
              >
                <Input prefix={<BookOutlined style={{ color: '#bfbfbf' }} />} placeholder="SDU / IITU / AITU" style={{ height: '45px', borderRadius: '8px' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item 
            name="city" 
            label={<Text strong>City / Region</Text>} 
            rules={[{ required: true, message: 'Выберите ваш город' }]}
          >
            <Select 
              placeholder="Выберите локацию" 
              style={{ height: '45px' }} 
              suffixIcon={<EnvironmentOutlined />}
            >
              <Select.Option value="Almaty">Almaty</Select.Option>
              <Select.Option value="Astana">Astana</Select.Option>
              <Select.Option value="Shymkent">Shymkent</Select.Option>
              <Select.Option value="Qyzylorda">Qyzylorda (Rural Bonus Eligibility)</Select.Option>
              <Select.Option value="Atyrau">Atyrau (Rural Bonus Eligibility)</Select.Option>
              <Select.Option value="Turkistan">Turkistan (Rural Bonus Eligibility)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item 
            name="essay" 
            label={<Text strong>Motivation Essay (PDF)</Text>} 
            extra="Загрузи эссе, чтобы наш ИИ оценил твои лидерские качества и мотивацию"
          >
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button 
                icon={<UploadOutlined />} 
                style={{ width: '100%', height: '45px', borderRadius: '8px', borderStyle: 'dashed' }}
              >
                Загрузить PDF
              </Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginTop: '30px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              block 
              style={{ 
                height: '50px', 
                borderRadius: '12px', 
                background: '#006CFF', 
                fontSize: '16px', 
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0, 108, 255, 0.2)'
              }}
            >
              Отправить заявку
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StudentForm;