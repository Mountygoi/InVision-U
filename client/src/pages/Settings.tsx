import { useState, useEffect } from 'react';
import { Card, Slider, Typography, Space, Divider, Button, message, Spin } from 'antd';
import { Award, Globe, Brain, Save } from 'lucide-react';
import axios from 'axios';
import type { ScoringWeights } from '../types';

const { Title, Text } = Typography;

const DEFAULT_WEIGHTS: ScoringWeights = {
  motivation: 20,
  leadership: 25,
  technicalPotential: 15,
  creativity: 10,
  resilience: 20,
  socialImpact: 10,
  achievementBonus: 15,
  ruralBonus: 10,
};

const Settings = () => {
  const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('http://localhost:5000/api/scoring-config')
      .then(res => setWeights(res.data.weights))
      .catch(() => console.warn('Could not load scoring config, using defaults'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof ScoringWeights, value: number) => {
    setWeights({ ...weights, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('http://localhost:5000/api/scoring-config', { weights });
      message.success('Scoring weights saved and all candidate scores recalculated');
    } catch (err) {
      message.error('Failed to save scoring config');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    message.info('Weights reset to defaults (not saved yet)');
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;

  const totalDimensionWeight = weights.motivation + weights.leadership + weights.technicalPotential + weights.creativity + weights.resilience + weights.socialImpact;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '900px', fontFamily: 'Inter, sans-serif' }}>
      <Title level={2}>Scoring Configuration</Title>
      <Text type="secondary">Configure the AI scoring weights to prioritize candidate dimensions. Changes recalculate all scores.</Text>

      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* AI Dimension Weights */}
        <Card title={<Space><Brain size={18} /> AI Dimension Weights <Text type="secondary" style={{ fontSize: 12 }}>(Total: {totalDimensionWeight})</Text></Space>}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Motivation</Text><Text strong>{weights.motivation}</Text></div>
            <Slider max={50} value={weights.motivation} onChange={(val) => handleChange('motivation', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Leadership</Text><Text strong>{weights.leadership}</Text></div>
            <Slider max={50} value={weights.leadership} onChange={(val) => handleChange('leadership', val)} trackStyle={{ background: '#006CFF' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Technical Potential</Text><Text strong>{weights.technicalPotential}</Text></div>
            <Slider max={50} value={weights.technicalPotential} onChange={(val) => handleChange('technicalPotential', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Creativity</Text><Text strong>{weights.creativity}</Text></div>
            <Slider max={50} value={weights.creativity} onChange={(val) => handleChange('creativity', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>Resilience / "Path Traveled" <Text type="secondary" style={{ fontSize: 11 }}>— InVision U core value</Text></Text>
              <Text strong>{weights.resilience}</Text>
            </div>
            <Slider max={50} value={weights.resilience} onChange={(val) => handleChange('resilience', val)} trackStyle={{ background: '#00D8E6' }} handleStyle={{ borderColor: '#00D8E6' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Social Impact</Text><Text strong>{weights.socialImpact}</Text></div>
            <Slider max={50} value={weights.socialImpact} onChange={(val) => handleChange('socialImpact', val)} />
          </div>
        </Card>

        {/* Bonus Weights */}
        <Card title={<Space><Award size={18} /> Bonus Factors</Space>}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Achievement Bonus (olympiads, projects, awards)</Text><Text strong>{weights.achievementBonus}</Text></div>
            <Slider max={30} value={weights.achievementBonus} onChange={(val) => handleChange('achievementBonus', val)} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Rural Area Bonus</Text><Text strong>{weights.ruralBonus}</Text></div>
            <Slider max={30} value={weights.ruralBonus} onChange={(val) => handleChange('ruralBonus', val)} trackStyle={{ background: '#00D8E6' }} handleStyle={{ borderColor: '#00D8E6' }} />
            <Text type="secondary" style={{ fontSize: 12 }}>This parameter helps nVision U discover hidden talents in rural regions of Kazakhstan.</Text>
          </div>
        </Card>

        {/* Transparency Card */}
        <Card title={<Space><Globe size={18} /> Scoring Formula (Transparency)</Space>} style={{ borderLeft: '4px solid #006CFF' }}>
          <Text style={{ fontSize: 13, lineHeight: '1.8' }}>
            <strong>Composite Score</strong> = (Weighted AI Dimension Average x 0.75) + Achievement Bonus + Rural Bonus<br />
            <strong>AI Dimensions</strong>: Each essay is analyzed by Claude AI across 6 dimensions (0-100). Scores are weighted by the sliders above.<br />
            <strong>Achievement Bonus</strong>: Deterministic points for olympiads (8-20pts), volunteering (10pts), projects (10pts), awards (8pts). Capped at 50.<br />
            <strong>Rural Bonus</strong>: Added for candidates from underrepresented regions.<br />
            <strong>AI does NOT make final decisions.</strong> All scores are recommendations for the human admissions committee.
          </Text>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="primary" icon={<Save size={16} />} onClick={handleSave} loading={saving} size="large"
            style={{ borderRadius: 10, background: '#006CFF', fontWeight: 600 }}>
            Save & Recalculate All Scores
          </Button>
          <Button onClick={handleReset} size="large" style={{ borderRadius: 10 }}>
            Reset to Defaults
          </Button>
        </div>
      </Space>
    </div>
  );
};

export default Settings;
