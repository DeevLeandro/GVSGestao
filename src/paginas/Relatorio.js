import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../services/api';

// ── Helper FireDAC robusto ─────────────────────────────────────────────
const extractRows = (data) => {
  if (!data) return [];
  if (data.FDBS) {
    try {
      const mgr    = data.FDBS.Manager ?? data.FDBS.manager;
      const tables = mgr?.TableList ?? mgr?.tablelist ?? [];
      if (tables.length > 0) {
        const rowList = tables[0].RowList ?? tables[0].rowlist ?? [];
        if (rowList.length > 0)
          return rowList.map((r) => r.Original ?? r.Current ?? r);
      }
    } catch (e) {}
  }
  if (data.Table && Array.isArray(data.Table)) return data.Table;
  if (Array.isArray(data)) return data;
  return [];
};

// Normaliza chaves para minúsculo (FireDAC pode retornar CLI_ID ou cli_id)
const normalize = (row) => {
  if (!row || typeof row !== 'object') return {};
  const out = {};
  for (const [k, v] of Object.entries(row)) out[k.toLowerCase()] = v;
  return out;
};

// ── Formatadores ───────────────────────────────────────────────────────
const fmtMilhas = (v) => new Intl.NumberFormat('pt-BR').format(Math.round(Number(v) || 0));
const fmtMoeda  = (v) => Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct    = (v) => `${Number(v || 0).toFixed(2).replace('.', ',')}%`;

const fmtDate = (v) => {
  if (!v) return '—';
  const s = String(v).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  if (s.match(/^\d{2}\/\d{2}\/\d{4}/)) return s.slice(0, 10);
  return s;
};

const Relatorio = ({ clienteId: clienteIdProp }) => {
  const [loading, setLoading]     = useState(true);
  const [linhas, setLinhas]       = useState([]);
  const [filtradas, setFiltradas] = useState([]);
  const [titular, setTitular]     = useState(null);
  const [clienteId, setClienteId] = useState(null);

  // Filtros
  const [mesFiltro, setMesFiltro]       = useState('todos');
  const [anoFiltro, setAnoFiltro]       = useState('todos');
  const [cartaoFiltro, setCartaoFiltro] = useState('todos');
  const [tipoFiltro, setTipoFiltro]     = useState('todos');
  const [categFiltro, setCategFiltro]   = useState('todos');

  // Anos únicos extraídos do campo ano_mes ("2026-05" → "2026")
  const anosUnicos = React.useMemo(() => {
    const seen = new Set();
    linhas.forEach((l) => {
      const ano = (l.ano_mes || '').slice(0, 4);
      if (ano) seen.add(ano);
    });
    return [...seen].sort().reverse();
  }, [linhas]);

  const programas = React.useMemo(() => {
    const seen = new Set();
    return linhas
      .filter((l) => {
        const k = `${l.car_id}|${l.car_nome_programa}`;
        if (seen.has(k)) return false;
        seen.add(k); return true;
      })
      .map((l) => ({ id: l.car_id, nome: l.car_nome_programa }));
  }, [linhas]);

  const categorias = React.useMemo(() => {
    return [...new Set(linhas.map((l) => l.tra_categoria).filter(Boolean))];
  }, [linhas]);

  // ── Métricas ───────────────────────────────────────────────────────
  const metricas = React.useMemo(() => {
    let entMilhas = 0, saidaMilhas = 0, economia = 0;
    filtradas.forEach((t) => {
      entMilhas   += Number(t.milhas_entrada  || 0);
      saidaMilhas += Number(t.milhas_saida    || 0);
      economia    += Number(t.economia_reais  || 0);
    });
    const saldoFinal = filtradas.length > 0
      ? Number(filtradas[filtradas.length - 1].saldo_acumulado || 0)
      : 0;
    return { entMilhas, saidaMilhas, economia, saldoFinal };
  }, [filtradas]);

  // ── Resolve clienteId ──────────────────────────────────────────────
  useEffect(() => {
    let id = clienteIdProp;
    if (!id) {
      try { const u = JSON.parse(localStorage.getItem('user') || '{}'); id = u.cli_id || u.id; } catch (e) {}
      if (!id) id = parseInt(localStorage.getItem('userID') || '0') || null;
    }
    if (id) setClienteId(id);
    else setLoading(false);
  }, [clienteIdProp]);

  useEffect(() => { if (clienteId) carregarDados(); }, [clienteId]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [titRes, relRes] = await Promise.all([
        api.get('/ServerPrincipal/PesquisaTitular',   { params: { Cliente: clienteId } }),
        api.get('/ServerPrincipal/RelatorioEconomia', { params: { Cliente: clienteId } }),
      ]);

      // Normaliza titular
      const titRows = extractRows(titRes.data).map(normalize);
      setTitular(titRows[0] || null);

      // Normaliza todas as linhas do relatório
      const rows = extractRows(relRes.data).map(normalize);
      setLinhas(rows);
      setFiltradas(rows);
    } catch (e) {
      console.error('Erro ao carregar relatório:', e);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let res = [...linhas];
    if (anoFiltro !== 'todos')
      res = res.filter((t) => (t.ano_mes || '').startsWith(anoFiltro));
    if (mesFiltro !== 'todos')
      res = res.filter((t) => (t.ano_mes || '').slice(5, 7) === mesFiltro);
    if (cartaoFiltro !== 'todos')
      res = res.filter((t) => String(t.car_id) === String(cartaoFiltro));
    if (tipoFiltro !== 'todos')
      res = res.filter((t) => (t.tra_tipo || '').toUpperCase() === tipoFiltro);
    if (categFiltro !== 'todos')
      res = res.filter((t) => t.tra_categoria === categFiltro);
    setFiltradas(res);
  };

  const limparFiltros = () => {
    setMesFiltro('todos'); setAnoFiltro('todos');
    setCartaoFiltro('todos'); setTipoFiltro('todos'); setCategFiltro('todos');
    setFiltradas(linhas);
  };

  // ── Exportar CSV ───────────────────────────────────────────────────
  const exportarCSV = () => {
    const header = ['Data','Tipo','Categoria','Programa','Identificação','Milhas Entrada','Milhas Saída','Valor Pagante R$','Custo Unitário','Extras','Economia R$','Economia %','Saldo Acumulado'];
    const rows = filtradas.map((t) => [
      t.data_formatada || fmtDate(t.tra_data),
      t.tra_tipo        || '',
      t.tra_categoria   || '',
      t.car_nome_programa || '',
      t.identificacao   || '',
      fmtMilhas(t.milhas_entrada),
      fmtMilhas(t.milhas_saida),
      fmtMoeda(t.valor_reais),
      fmtMoeda(t.custo_unitario),
      fmtMoeda(t.extras),
      fmtMoeda(t.economia_reais),
      fmtPct(t.percentual_economia),
      fmtMilhas(t.saldo_acumulado),
    ]);
    const csv  = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `relatorio_milhas_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Exportar Excel ─────────────────────────────────────────────────
  const exportarExcel = () => {
    const dados = filtradas.map((t) => ({
      'Data':               t.data_formatada || fmtDate(t.tra_data),
      'Tipo':               t.tra_tipo        || '',
      'Categoria':          t.tra_categoria   || '',
      'Programa':           t.car_nome_programa || '',
      'Identificação':      t.identificacao   || '',
      'Milhas Entrada':     Number(t.milhas_entrada   || 0),
      'Milhas Saída':       Number(t.milhas_saida     || 0),
      'Valor Pagante R$':   Number(t.valor_reais      || 0),
      'Custo Unitário':     Number(t.custo_unitario   || 0),
      'Extras':             Number(t.extras           || 0),
      'Economia R$':        Number(t.economia_reais   || 0),
      'Economia %':         Number(t.percentual_economia || 0),
      'Saldo Acumulado':    Number(t.saldo_acumulado  || 0),
    }));
    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transações');
    ws['!cols'] = [12,10,16,28,40,14,14,14,14,12,12,12,16].map((w) => ({ wch: w }));
    XLSX.writeFile(wb, `relatorio_milhas_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // ── Exportar PDF ───────────────────────────────────────────────────
  const exportarPDF = () => {
    const doc  = new jsPDF({ orientation: 'landscape' });
    const nome = titular?.cli_nome || 'Cliente';
    doc.setFontSize(16);
    doc.text('Relatório de Economia em Milhas', 14, 18);
    doc.setFontSize(10);
    doc.text(`Cliente: ${nome}  |  CPF: ${titular?.cli_cpf || ''}  |  Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);

    doc.setFontSize(9);
    doc.text(`Entradas: ${fmtMilhas(metricas.entMilhas)} milhas`, 14, 33);
    doc.text(`Saídas: ${fmtMilhas(metricas.saidaMilhas)} milhas`, 70, 33);
    doc.text(`Economia Total: R$ ${fmtMoeda(metricas.economia)}`, 130, 33);
    doc.text(`Saldo Acumulado: ${fmtMilhas(metricas.saldoFinal)} milhas`, 210, 33);

    autoTable(doc, {
      startY: 38,
      head: [['Data','Tipo','Programa','Identificação','Entrada','Saída','Valor Pagante','Extras','Economia R$','%Econ','Saldo']],
      body: filtradas.map((t) => [
        t.data_formatada || fmtDate(t.tra_data),
        t.tra_tipo || '',
        t.car_nome_programa || '',
        (t.identificacao || '').slice(0, 35),
        Number(t.milhas_entrada) > 0 ? fmtMilhas(t.milhas_entrada) : '—',
        Number(t.milhas_saida)   > 0 ? fmtMilhas(t.milhas_saida)   : '—',
        Number(t.valor_reais)    > 0 ? `R$ ${fmtMoeda(t.valor_reais)}` : '—',
        Number(t.extras)         > 0 ? `R$ ${fmtMoeda(t.extras)}`  : '0,00',
        Number(t.economia_reais) > 0 ? `R$ ${fmtMoeda(t.economia_reais)}` : '—',
        Number(t.percentual_economia) > 0 ? fmtPct(t.percentual_economia) : '—',
        fmtMilhas(t.saldo_acumulado),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [26, 58, 74], textColor: 255, fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 1.5 },
      columnStyles: {
        0:{cellWidth:22}, 1:{cellWidth:14}, 2:{cellWidth:30},
        3:{cellWidth:42}, 4:{cellWidth:18,halign:'right'}, 5:{cellWidth:18,halign:'right'},
        6:{cellWidth:20,halign:'right'}, 7:{cellWidth:16,halign:'right'},
        8:{cellWidth:20,halign:'right'}, 9:{cellWidth:13,halign:'right'},
        10:{cellWidth:18,halign:'right'},
      },
    });
    doc.save(`relatorio_milhas_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  // ── Badge tipo ─────────────────────────────────────────────────────
  const TipoBadge = ({ tipo }) => {
    const t = (tipo || '').toUpperCase();
    if (t === 'ENTRADA') return <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, background:'#f6ffed', color:'#389e0d', fontWeight:600 }}>↑ ENTRADA</span>;
    if (t === 'SAIDA')   return <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, background:'#fff1f0', color:'#cf1322', fontWeight:600 }}>↓ SAÍDA</span>;
    return <span style={{ padding:'2px 8px', borderRadius:10, fontSize:11, background:'#f0f0f0', color:'#666' }}>{t}</span>;
  };

  const S = {
    page:      { minHeight:'100vh', background:'#f0f2f5', padding:'24px' },
    card:      { background:'#fff', borderRadius:8, boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:20 },
    header:    { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #f0f0f0' },
    filterBar: { background:'#1a3a4a', padding:'14px 20px', display:'flex', alignItems:'flex-end', gap:14, flexWrap:'wrap' },
    fGrp:      { display:'flex', flexDirection:'column', gap:4 },
    fLbl:      { fontSize:11, color:'#aac', fontWeight:500 },
    sel:       { padding:'6px 10px', borderRadius:4, border:'1px solid #ddd', background:'#fff', fontSize:13, cursor:'pointer', height:34 },
    btn:       (bg) => ({ height:34, padding:'0 16px', borderRadius:4, border:'none', fontWeight:600, fontSize:12, cursor:'pointer', background:bg, color:'#fff' }),
    th:        { padding:'10px 12px', fontSize:11, color:'#888', fontWeight:600, textAlign:'left', borderBottom:'1px solid #f0f0f0', background:'#fafafa', whiteSpace:'nowrap' },
    td:        { padding:'9px 12px', fontSize:12, color:'#333', borderBottom:'1px solid #f5f5f5' },
    tdr:       { padding:'9px 12px', fontSize:12, color:'#333', borderBottom:'1px solid #f5f5f5', textAlign:'right' },
  };

  if (loading) return (
    <div style={{ padding:60, textAlign:'center', color:'#666' }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🔄</div>
      Carregando relatório...
    </div>
  );

  return (
    <div style={S.page}>

      {/* HEADER */}
      <div style={S.card}>
        <div style={S.header}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#222' }}>📊 Relatório de Economia em Milhas</div>
            {titular && (
              <div style={{ fontSize:12, color:'#888', marginTop:3 }}>
                {titular.cli_nome} · CPF {titular.cli_cpf} · {titular.cli_email}
              </div>
            )}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={S.btn('#52c41a')} onClick={exportarCSV}>📄 CSV</button>
            <button style={S.btn('#1677ff')} onClick={exportarExcel}>📊 EXCEL</button>
            <button style={S.btn('#ff4d4f')} onClick={exportarPDF}>🖨️ PDF</button>
          </div>
        </div>
      </div>

      {/* MÉTRICAS */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:20 }}>
        {[
          { valor: fmtMilhas(metricas.saldoFinal),      label:'Saldo Acumulado', sub:'milhas',    cor:'#1677ff' },
          { valor: fmtMilhas(metricas.entMilhas),        label:'Total Entradas',  sub:'milhas',    cor:'#389e0d' },
          { valor: fmtMilhas(metricas.saidaMilhas),      label:'Total Saídas',    sub:'milhas',    cor:'#cf1322' },
          { valor: `R$ ${fmtMoeda(metricas.economia)}`,  label:'Economia Total',  sub:'em reais',  cor:'#f5a623' },
          { valor: filtradas.length,                     label:'Transações',      sub:'no período',cor:'#722ed1' },
        ].map((m) => (
          <div key={m.label} style={{ background:'#fff', borderRadius:8, padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:700, color:m.cor }}>{m.valor}</div>
            <div style={{ fontSize:12, color:'#666', marginTop:3 }}>{m.label}</div>
            <div style={{ fontSize:11, color:'#aaa' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={S.card}>
        <div style={S.filterBar}>
          <div style={S.fGrp}>
            <span style={S.fLbl}>Ano</span>
            <select value={anoFiltro} onChange={(e) => setAnoFiltro(e.target.value)} style={S.sel}>
              <option value="todos">Todos os anos</option>
              {anosUnicos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div style={S.fGrp}>
            <span style={S.fLbl}>Mês</span>
            <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} style={S.sel}>
              <option value="todos">Todos os meses</option>
              {['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
                .map((m, i) => <option key={i} value={String(i+1).padStart(2,'0')}>{m}</option>)}
            </select>
          </div>
          <div style={S.fGrp}>
            <span style={S.fLbl}>Programa</span>
            <select value={cartaoFiltro} onChange={(e) => setCartaoFiltro(e.target.value)} style={S.sel}>
              <option value="todos">Todos os programas</option>
              {programas.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div style={S.fGrp}>
            <span style={S.fLbl}>Tipo</span>
            <select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)} style={S.sel}>
              <option value="todos">Todos</option>
              <option value="ENTRADA">↑ Entradas</option>
              <option value="SAIDA">↓ Saídas</option>
            </select>
          </div>
          <div style={S.fGrp}>
            <span style={S.fLbl}>Categoria</span>
            <select value={categFiltro} onChange={(e) => setCategFiltro(e.target.value)} style={S.sel}>
              <option value="todos">Todas</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button style={S.btn('#1677ff')} onClick={aplicarFiltros}>🔍 APLICAR</button>
          <button style={S.btn('#666')} onClick={limparFiltros}>✕ LIMPAR</button>
        </div>
      </div>

      {/* TABELA */}
      <div style={S.card}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Data','Tipo','Categoria','Programa','Identificação','Entrada','Saída','Valor Pagante','Extras','Economia R$','% Econ.','Saldo Acum.'].map((h) => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtradas.length === 0 ? (
                <tr><td colSpan={12} style={{ textAlign:'center', padding:40, color:'#bbb', fontSize:13 }}>Nenhuma transação encontrada.</td></tr>
              ) : (
                filtradas.map((t, idx) => {
                  const entMilhas  = Number(t.milhas_entrada        || 0);
                  const saidMilhas = Number(t.milhas_saida          || 0);
                  const economia   = Number(t.economia_reais        || 0);
                  const pctEcon    = Number(t.percentual_economia   || 0);
                  const vlrPagante = Number(t.valor_reais           || 0);
                  const extras     = Number(t.extras                || 0);

                  return (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      {/* Data */}
                      <td style={S.td}>{t.data_formatada || fmtDate(t.tra_data)}</td>

                      {/* Tipo */}
                      <td style={S.td}><TipoBadge tipo={t.tra_tipo} /></td>

                      {/* Categoria */}
                      <td style={S.td}>
                        <span style={{ fontSize:11, background:'#f5f5f5', padding:'2px 7px', borderRadius:8, color:'#666' }}>
                          {t.tra_categoria || '—'}
                        </span>
                      </td>

                      {/* Programa */}
                      <td style={{ ...S.td, fontWeight:600 }}>{t.car_nome_programa || '—'}</td>

                      {/* Identificação */}
                      <td style={{ ...S.td, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                        title={t.identificacao || ''}>
                        {t.identificacao || '—'}
                      </td>

                      {/* Entrada milhas */}
                      <td style={{ ...S.tdr, color:'#389e0d', fontWeight:600 }}>
                        {entMilhas > 0 ? fmtMilhas(entMilhas) : '—'}
                      </td>

                      {/* Saída milhas */}
                      <td style={{ ...S.tdr, color:'#cf1322', fontWeight:600 }}>
                        {saidMilhas > 0 ? fmtMilhas(saidMilhas) : '—'}
                      </td>

                      {/* Valor Pagante (passagem + taxas + bagagem) */}
                      <td style={S.tdr}>
                        {vlrPagante > 0 ? `R$ ${fmtMoeda(vlrPagante)}` : '—'}
                      </td>

                      {/* Extras (taxas + bagagem) */}
                      <td style={S.tdr}>
                        {extras > 0 ? `R$ ${fmtMoeda(extras)}` : '0,00'}
                      </td>

                      {/* Economia R$ — vem de ven_veconomia via SQL JOIN */}
                      <td style={{ ...S.tdr, color: economia > 0 ? '#389e0d' : economia < 0 ? '#cf1322' : '#999', fontWeight:600 }}>
                        {economia > 0 ? `R$ ${fmtMoeda(economia)}` : '—'}
                      </td>

                      {/* Economia % — vem de ven_peconomia via SQL JOIN */}
                      <td style={{ ...S.tdr, color: pctEcon > 0 ? '#389e0d' : '#999' }}>
                        {pctEcon > 0 ? fmtPct(pctEcon) : '—'}
                      </td>

                      {/* Saldo acumulado */}
                      <td style={{ ...S.tdr, fontWeight:700, color:'#1677ff' }}>
                        {fmtMilhas(t.saldo_acumulado)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Totais */}
            {filtradas.length > 0 && (
              <tfoot>
                <tr style={{ background:'#f8f9fa' }}>
                  <td colSpan={5} style={{ padding:'10px 12px', fontWeight:700, fontSize:12, color:'#333', borderTop:'2px solid #e8e8e8' }}>
                    TOTAL ({filtradas.length} transações)
                  </td>
                  <td style={{ ...S.tdr, fontWeight:700, color:'#389e0d', borderTop:'2px solid #e8e8e8' }}>
                    {fmtMilhas(metricas.entMilhas)}
                  </td>
                  <td style={{ ...S.tdr, fontWeight:700, color:'#cf1322', borderTop:'2px solid #e8e8e8' }}>
                    {fmtMilhas(metricas.saidaMilhas)}
                  </td>
                  <td style={{ ...S.tdr, fontWeight:700, borderTop:'2px solid #e8e8e8' }}>
                    R$ {fmtMoeda(filtradas.reduce((s,t) => s + Number(t.valor_reais||0), 0))}
                  </td>
                  <td style={{ ...S.tdr, fontWeight:700, borderTop:'2px solid #e8e8e8' }}>
                    R$ {fmtMoeda(filtradas.reduce((s,t) => s + Number(t.extras||0), 0))}
                  </td>
                  <td style={{ ...S.tdr, fontWeight:700, color:'#389e0d', borderTop:'2px solid #e8e8e8' }}>
                    R$ {fmtMoeda(metricas.economia)}
                  </td>
                  <td colSpan={2} style={{ borderTop:'2px solid #e8e8e8' }} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default Relatorio;