import { Card, Slider, Typography, Space, Divider } from 'antd';
import { useScoring } from '../context/ScoringContext';
import { Award, Globe } from 'lucide-react';
const { Title, Text } = Typography;

const Settings = () => {
  const { weights, setWeights } = useScoring();

  const handleChange = (key: string, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px' }}>
      <Title level={2}>Scoring Configuration</Title>
      <Text type="secondary">Настройте веса алгоритма для приоритезации кандидатов</Text>
      
      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={<Space><Award size={18} /> Experience Weights</Space>}>
          <div style={{ marginBottom: '20px' }}>
            <Text>Volunteering (Max 40)</Text>
            <Slider 
              max={40} 
              value={weights.volunteering} 
              onChange={(val) => handleChange('volunteering', val)} 
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <Text>Olympiad (Max 50)</Text>
            <Slider 
              max={50} 
              value={weights.olympiad} 
              onChange={(val) => handleChange('olympiad', val)} 
            />
          </div>
          <div>
            <Text>Personal Projects (Max 30)</Text>
            <Slider 
              max={30} 
              value={weights.project} 
              onChange={(val) => handleChange('project', val)} 
            />
          </div>
        </Card>

        <Card title={<Space><Globe size={18} /> Mission Factors</Space>} style={{ borderLeft: '4px solid #00D8E6' }}>
          <Text>Rural Area Bonus (Поддержка талантов из сёл)</Text>
          <Slider 
            max={100} 
            value={weights.ruralBonus} 
            onChange={(val) => handleChange('ruralBonus', val)} 
            trackStyle={{ background: '#00D8E6' }}
            handleStyle={{ borderColor: '#00D8E6' }}
          />
          <Text type="secondary">Этот параметр помогает nVision U находить скрытые таланты в регионах.</Text>
        </Card>
      </Space>
    </div>
  );
};

export default Settings;