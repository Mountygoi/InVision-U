import { useState, useEffect } from 'react';
import { Card, Slider, Typography, Space, Divider, Button, message, Spin } from 'antd';
import { Globe, Brain, Save } from 'lucide-react';
import axios from 'axios';
import type { ScoringWeights } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const { Title, Text } = Typography;

const DEFAULT_WEIGHTS: ScoringWeights = {
  motivation: 20,
  leadership: 25,
  technicalPotential: 15,
  creativity: 10,
  resilience: 20,
  socialImpact: 0,
  achievementBonus: 15,
  ruralBonus: 10,
};

const Settings = () => {
  const { t } = useLanguage();
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
      message.success(t('weightsSaved'));
    } catch (err) {
      message.error(t('failedSaveConfig'));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
    message.info(t('weightsReset'));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}><Spin size="large" /></div>;

  const totalDimensionWeight = weights.motivation + weights.leadership + weights.technicalPotential + weights.creativity + weights.resilience;

  return (
    <div style={{ padding: '32px 40px', maxWidth: '900px', fontFamily: "'Raleway', sans-serif", animation: 'fadeInUp 0.5s cubic-bezier(0.16,1,0.3,1) both' }}>
      <Title level={2} style={{ letterSpacing: '-0.02em' }}>{t('scoringConfig')}</Title>
      <Text type="secondary">{t('scoringConfigDesc')}</Text>

      <Divider />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* AI Dimension Weights */}
        <Card title={<Space><Brain size={18} /> {t('aiDimensionWeights')} <Text type="secondary" style={{ fontSize: 12 }}>(Total: {totalDimensionWeight})</Text></Space>}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>{t('settMotivation')}</Text><Text strong>{weights.motivation}</Text></div>
            <Slider max={50} value={weights.motivation} onChange={(val) => handleChange('motivation', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>{t('settLeadership')}</Text><Text strong>{weights.leadership}</Text></div>
            <Slider max={50} value={weights.leadership} onChange={(val) => handleChange('leadership', val)} trackStyle={{ background: '#16a34a' }} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>{t('settTechnical')}</Text><Text strong>{weights.technicalPotential}</Text></div>
            <Slider max={50} value={weights.technicalPotential} onChange={(val) => handleChange('technicalPotential', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>{t('settCreativity')}</Text><Text strong>{weights.creativity}</Text></div>
            <Slider max={50} value={weights.creativity} onChange={(val) => handleChange('creativity', val)} />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text>{t('settResilience')} <Text type="secondary" style={{ fontSize: 11 }}>{t('settResilienceHint')}</Text></Text>
              <Text strong>{weights.resilience}</Text>
            </div>
            <Slider max={50} value={weights.resilience} onChange={(val) => handleChange('resilience', val)} trackStyle={{ background: '#3dedf1' }} handleStyle={{ borderColor: '#3dedf1' }} />
          </div>
        </Card>

        {/* Transparency Card */}
        <Card title={<Space><Globe size={18} /> {t('scoringFormula')}</Space>} style={{ borderLeft: '4px solid #16a34a' }}>
          <Text style={{ fontSize: 13, lineHeight: '1.8' }}>
            <strong>{t('compositeScore')}</strong> = {t('formulaText1')}<br />
            <strong>AI</strong>: {t('formulaText2')}<br />
            <strong>{t('achievements')}</strong>: {t('formulaText3')}<br />
            <strong>{t('ruralBonus')}</strong>: {t('formulaText4')}<br />
            <strong>{t('formulaText5')}</strong>
          </Text>
        </Card>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          <Button type="primary" icon={<Save size={16} />} onClick={handleSave} loading={saving} size="large"
            style={{ borderRadius: 10, background: '#16a34a', fontWeight: 600 }}>
            {t('saveRecalculate')}
          </Button>
          <Button onClick={handleReset} size="large" style={{ borderRadius: 10 }}>
            {t('resetDefaults')}
          </Button>
        </div>
      </Space>
    </div>
  );
};

export default Settings;
