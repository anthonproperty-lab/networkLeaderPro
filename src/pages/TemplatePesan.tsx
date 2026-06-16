import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-toastify';

export const TemplatePesan: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase.from('templates').select('*');
      if (data) setTemplates(data);
    };
    fetchTemplates();
  }, []);

  const salinTeks = (teks: string) => {
    navigator.clipboard.writeText(teks);
    toast.success('Template isi pesan berhasil disalin ke clipboard!');
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>Template Pesan WhatsApp</Typography>
      <Grid container spacing={2}>
        {templates.map((tpl) => (
          <Grid item xs={12} sm={6} key={tpl.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" mb={1} alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{tpl.judul}</Typography>
                  <Chip label={tpl.kategori} size="small" variant="outlined" color="primary" />
                </Box>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', mb: 2, border: '1px solid divider', color: 'text.primary' }}>{tpl.isi_pesan}</Box>
                <Button size="small" startIcon={<ContentCopy />} onClick={() => salinTeks(tpl.isi_pesan)}>Salin Template</Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
export default TemplatePesan;
