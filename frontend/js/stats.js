const API_BASE = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const daysSelect = document.getElementById("daysSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const liveToggle = document.getElementById("liveToggle");
  let timer = null;

  const render = () => {
    const days = parseInt(daysSelect.value, 10) || 14;
    renderPostsPerDay(days);
    renderMediaType();
    renderAvgLikesPerDay(days);
  };

  daysSelect.addEventListener("change", render);
  refreshBtn.addEventListener("click", render);

  function startLive(){
    if (timer) clearInterval(timer);
    if (liveToggle && liveToggle.checked){
      timer = setInterval(render, 10000);
    }
  }
  liveToggle?.addEventListener('change', ()=>{ startLive(); render(); });
  document.addEventListener('visibilitychange', ()=>{
    if (document.hidden) { if (timer) clearInterval(timer); timer = null; }
    else startLive();
  });

  try{ render(); }catch(e){ console.error(e); }
  startLive();
});

function bust(url){ const sep = url.includes('?')?'&':'?'; return `${url}${sep}_=${Date.now()}`; }

async function fetchJSON(url) {
  const res = await fetch(bust(url), { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || data.success === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function showMsg(selector, msg){
  const c = d3.select(selector);
  c.selectAll('*').remove();
  c.append('div').style('text-align','center').style('margin','12px').text(msg);
}

async function renderPostsPerDay(days){
  let series; try{ ({ series } = await fetchJSON(`${API_BASE}/api/stats/posts-per-day?days=${days}`)); }catch(e){ console.error(e); showMsg('#perDay','Failed to load posts-per-day. Is server running?'); return; }

  const container = d3.select('#perDay'); container.selectAll('*').remove();
  const rect = container.node().getBoundingClientRect();
  const width = Math.max(360, Math.min(1000, rect.width || 900));
  const height = 320, margin = { top:24, right:20, bottom:50, left:48 };
  const svg = container.append('svg').attr('width', width).attr('height', height);
  if (!series || series.every(d=>d.count===0)){ container.append('div').style('text-align','center').text('No posts in selected period'); return; }
  const x = d3.scaleBand().domain(series.map(d=>d.date)).range([margin.left, width - margin.right]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(series, d=>d.count) || 1]).nice().range([height - margin.bottom, margin.top]);
  const tooltip = d3.select('#tooltip');

  const step = Math.max(1, Math.ceil(series.length/10));
  const tickVals = series.map(d=>d.date).filter((_,i)=> i%step===0 || i===series.length-1);
  const xb = svg.append('g').attr('class','axis').attr('transform',`translate(0,${height-margin.bottom})`).call(d3.axisBottom(x).tickValues(tickVals).tickFormat(d=>d.slice(5)));
  xb.selectAll('text').style('font-size','12px').attr('transform', series.length>18? 'rotate(-45)': null).style('text-anchor', series.length>18? 'end':'middle');
  svg.append('g').attr('class','axis').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('g').attr('transform','translate(0,0)').call(d3.axisLeft(y).tickSize(-(width - margin.left - margin.right)).tickFormat('')).attr('stroke-opacity',0.1).selectAll('line').attr('x1',margin.left).attr('x2',width-margin.right).attr('stroke','var(--grid)');

  svg.append('g').selectAll('rect').data(series).enter().append('rect')
     .attr('x', d=>x(d.date)).attr('y', d=>y(d.count)).attr('width', x.bandwidth()).attr('height', d=>y(0)-y(d.count)).attr('rx',4).attr('ry',4).attr('fill','var(--brand)')
     .on('mousemove', (e,d)=> tooltip.style('opacity',1).html(`${d.date}: ${d.count}`).style('left',e.pageX+'px').style('top',e.pageY+'px'))
     .on('mouseout', ()=> tooltip.style('opacity',0));

  const avg = d3.mean(series, d=>d.count) || 0;
  svg.append('line').attr('x1',margin.left).attr('x2',width-margin.right).attr('y1',y(avg)).attr('y2',y(avg)).attr('stroke','var(--accent)').attr('stroke-dasharray','4,3');
  svg.append('text').attr('x', width - margin.right).attr('y', y(avg)-6).attr('text-anchor','end').style('font-size','12px').style('fill','var(--accent)').text(`avg ${avg.toFixed(2)}`);
}

async function renderMediaType(){
  let items; try{ ({ items } = await fetchJSON(`${API_BASE}/api/stats/media-type`)); }catch(e){ console.error(e); showMsg('#byType','Failed to load media-type stats.'); return; }
  const container = d3.select('#byType'); container.selectAll('*').remove();
  const rect2 = container.node().getBoundingClientRect();
  const width = Math.max(360, Math.min(1000, rect2.width || 900));
  const height = 320, margin = { top:24, right:20, bottom:50, left:48 };
  const svg = container.append('svg').attr('width', width).attr('height', height);
  if (!items || !items.length){ container.append('div').style('text-align','center').text('No posts by media type'); return; }
  const x = d3.scaleBand().domain(items.map(d=>d.mediaType || 'text')).range([margin.left, width - margin.right]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(items, d=>d.count) || 1]).nice().range([height - margin.bottom, margin.top]);
  const color = d3.scaleOrdinal().domain(items.map(d=>d.mediaType || 'text')).range(['#59a14f','#e15759','#f28e2b','#76b7b2']);
  const tooltip = d3.select('#tooltip');
  const step2 = Math.max(1, Math.ceil(items.length/6));
  const xv = items.map(d=>d.mediaType || 'text').filter((_,i)=> i%step2===0);
  svg.append('g').attr('class','axis').attr('transform',`translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickValues(xv));
  svg.append('g').attr('class','axis').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('g').attr('transform','translate(0,0)').call(d3.axisLeft(y).tickSize(-(width - margin.left - margin.right)).tickFormat('')).attr('stroke-opacity',0.1).selectAll('line').attr('x1',margin.left).attr('x2',width-margin.right).attr('stroke','var(--grid)');
  svg.append('g').selectAll('rect').data(items).enter().append('rect')
     .attr('x', d=>x(d.mediaType || 'text')).attr('y', d=>y(d.count)).attr('width', x.bandwidth()).attr('height', d=>y(0)-y(d.count)).attr('rx',4).attr('ry',4).attr('fill', d=>color(d.mediaType || 'text'))
     .on('mousemove', (e,d)=> tooltip.style('opacity',1).html(`${d.mediaType || 'text'}: ${d.count}`).style('left',e.pageX+'px').style('top',e.pageY+'px'))
     .on('mouseout', ()=> tooltip.style('opacity',0));
  const legend = d3.select('#byTypeLegend'); legend.selectAll('*').remove(); items.forEach(d=>{ const row=legend.append('div'); row.html(`<span class="sw" style="background:${color(d.mediaType || 'text')}"></span>${(d.mediaType || 'text')}: ${d.count}`); });
}

async function renderAvgLikesPerDay(days){
  let series; try{ ({ series } = await fetchJSON(`${API_BASE}/api/stats/likes-avg-per-day?days=${days}`)); }catch(e){ console.error(e); showMsg('#avgLikes','Failed to load average likes data.'); return; }
  const container = d3.select('#avgLikes'); container.selectAll('*').remove();
  const rect3 = container.node().getBoundingClientRect();
  const width = Math.max(360, Math.min(1000, rect3.width || 900));
  const height = 320, margin = { top:24, right:20, bottom:50, left:48 };
  const svg = container.append('svg').attr('width', width).attr('height', height);
  const x = d3.scaleBand().domain(series.map(d=>d.date)).range([margin.left, width - margin.right]).padding(0.2);
  const y = d3.scaleLinear().domain([0, d3.max(series, d=>d.avgLikes) || 1]).nice().range([height - margin.bottom, margin.top]);
  const step3 = Math.max(1, Math.ceil(series.length/10));
  const tvals3 = series.map(d=>d.date).filter((_,i)=> i%step3===0 || i===series.length-1);
  const xb3 = svg.append('g').attr('class','axis').attr('transform',`translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).tickValues(tvals3).tickFormat(d=>d.slice(5)));
  xb3.selectAll('text').style('font-size','12px').attr('transform', series.length>18? 'rotate(-45)': null).style('text-anchor', series.length>18? 'end':'middle');
  svg.append('g').attr('class','axis').attr('transform',`translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(6));
  svg.append('g').attr('transform','translate(0,0)').call(d3.axisLeft(y).tickSize(-(width - margin.left - margin.right)).tickFormat('')).attr('stroke-opacity',0.1).selectAll('line').attr('x1',margin.left).attr('x2',width-margin.right).attr('stroke','var(--grid)');
  const tooltip = d3.select('#tooltip');
  const line = d3.line().x(d=> x(d.date)+x.bandwidth()/2).y(d=>y(d.avgLikes));
  svg.append('path').datum(series).attr('d', line).attr('fill','none').attr('stroke','var(--accent-2)').attr('stroke-width',2);
  svg.selectAll('circle').data(series).enter().append('circle').attr('cx', d=>x(d.date)+x.bandwidth()/2).attr('cy', d=>y(d.avgLikes)).attr('r',3).attr('fill','var(--accent-2)')
     .on('mousemove', (e,d)=> tooltip.style('opacity',1).html(`${d.date}: ${d.avgLikes}`).style('left',e.pageX+'px').style('top',e.pageY+'px'))
     .on('mouseout', ()=> tooltip.style('opacity',0));
}

