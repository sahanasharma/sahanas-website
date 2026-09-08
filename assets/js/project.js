/* Small public demonstrations. No private company data or external services. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const numberFormat = new Intl.NumberFormat('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = value => `${value < 0 ? '−' : ''}S$${numberFormat.format(Math.abs(value))}`;
  const fields = [
    ['quantity', 'quantity', 'Order quantity', 1, 1000000, 1],
    ['unitCost', 'unit-cost', 'Supplier cost', 0, 100000, .01],
    ['fx', 'exchange-rate', 'Exchange rate', .0001, 1000, .0001],
    ['freight', 'freight', 'Freight', 0, 10000000, .01],
    ['insurance', 'insurance', 'Insurance', 0, 10000000, .01],
    ['margin', 'margin', 'Target margin', 0, 95, .1],
    ['budget', 'budget', 'Cash budget', 0, 1000000000, .01]
  ];
  function validateScenario(values) {
    for (const [key, , label, min, max, step] of fields) {
      const value = values[key];
      if (typeof value !== 'number' || !Number.isFinite(value)) throw new RangeError(`${label}: enter a number.`);
      if (value < min || value > max) throw new RangeError(`${label}: use a value from ${min} to ${max}.`);
      if (Math.abs(value / step - Math.round(value / step)) > 0.00001) {
        throw new RangeError(key === 'quantity' ? 'Order quantity must be a whole number.' : `${label}: use increments of ${step}.`);
      }
    }
  }
  function calculateScenario(values) {
    validateScenario(values);
    /* Integer arithmetic avoids a floating-point extra cent in the minimum quote.
       Supplier prices have two decimals; FX has four; the margin has one percent decimal.
       Total included cost is held in millionths of SGD until output formatting. */
    const q = BigInt(values.quantity);
    const unitCents = BigInt(Math.round(values.unitCost * 100));
    const fxUnits = BigInt(Math.round(values.fx * 10000));
    const freightCents = BigInt(Math.round(values.freight * 100));
    const insuranceCents = BigInt(Math.round(values.insurance * 100));
    const marginUnits = BigInt(Math.round(values.margin * 10));
    const totalMicro = q * unitCents * fxUnits + (freightCents + insuranceCents) * 10000n;
    if (totalMicro <= 0n) throw new RangeError('Enter at least one positive cost. A zero-revenue quote has no defined percentage margin.');
    if (totalMicro > 10000000000000000n) throw new RangeError('This scenario is too large for the public demonstration. Keep total included cost at or below S$10 billion.');
    const denominator = 10n * q * (1000n - marginUnits);
    const priceCents = (totalMicro + denominator - 1n) / denominator;
    const revenueMicro = priceCents * q * 10000n;
    const contributionMicro = revenueMicro - totalMicro;
    const totalCost = Number(totalMicro) / 1000000;
    const revenue = Number(revenueMicro) / 1000000;
    return {
      price: Number(priceCents) / 100,
      unitCost: totalCost / values.quantity,
      totalCost,
      revenue,
      contribution: Number(contributionMicro) / 1000000,
      margin: Number(contributionMicro) / Number(revenueMicro) * 100,
      cashHeadroom: values.budget - totalCost,
      procurement: Number(q * unitCents * fxUnits) / 1000000,
      freight: values.freight,
      insurance: values.insurance
    };
  }
  function forecastMetrics(actual, forecast) {
    if (!Array.isArray(actual) || !Array.isArray(forecast) || !actual.length || actual.length !== forecast.length) {
      throw new RangeError('Forecast evaluation needs equally sized, non-empty numeric arrays.');
    }
    const errors = actual.map((value, i) => {
      if (!Number.isFinite(value) || !Number.isFinite(forecast[i])) throw new RangeError('Forecast arrays must contain finite numbers.');
      return value - forecast[i];
    });
    return {
      mae: errors.reduce((total, value) => total + Math.abs(value), 0) / errors.length,
      rmse: Math.sqrt(errors.reduce((total, value) => total + value * value, 0) / errors.length),
      bias: errors.reduce((total, value) => total + value, 0) / errors.length,
      count: errors.length
    };
  }
  window.ProjectMath = Object.freeze({ calculateScenario, forecastMetrics });

  const form = $('#quotation-form');
  const resultBox = $('#lab-results');
  const errorBox = $('#lab-error');
  const budgetMessage = $('#budget-message');
  const costVisual = $('#cost-visual');
  let liveTimer = 0;
  function refreshQuote() {
    const values = {};
    fields.forEach(([key, id]) => {
      const input = $(`#lab-${id}`);
      values[key] = input.value.trim() === '' ? NaN : Number(input.value);
      input.setAttribute('aria-invalid', String(!input.validity.valid || !Number.isFinite(values[key])));
    });
    try {
      const result = calculateScenario(values);
      errorBox.hidden = true; errorBox.textContent = '';
      resultBox.hidden = false; costVisual.hidden = false; budgetMessage.hidden = false;
      $('#quote-price').textContent = money(result.price);
      $('#quote-unit-cost').textContent = money(result.unitCost);
      $('#quote-cost').textContent = money(result.totalCost);
      $('#quote-revenue').textContent = money(result.revenue);
      $('#quote-contribution').textContent = money(result.contribution);
      $('#quote-margin').textContent = `${result.margin.toFixed(2)}%`;
      $('#quote-headroom').textContent = money(result.cashHeadroom);
      budgetMessage.classList.toggle('over-budget', result.cashHeadroom < 0);
      budgetMessage.textContent = result.cashHeadroom < 0
        ? `Budget check: the included upfront cost exceeds the illustrative budget by ${money(-result.cashHeadroom)}.`
        : `Budget check: the included upfront cost fits within the illustrative budget, leaving ${money(result.cashHeadroom)}.`;
      [['procurement', result.procurement], ['freight', result.freight], ['insurance', result.insurance], ['contribution', result.contribution]].forEach(([name, value]) => {
        $(`#bar-${name}`).style.width = `${value / result.revenue * 100}%`;
      });
      $('#cost-bar').setAttribute('aria-label', `Synthetic revenue breakdown: procurement ${money(result.procurement)}, freight ${money(result.freight)}, insurance ${money(result.insurance)}, contribution ${money(result.contribution)}.`);
      clearTimeout(liveTimer);
      liveTimer = setTimeout(() => {
        $('#lab-live').textContent = `Synthetic scenario updated. Minimum unit price ${money(result.price)}. Contribution ${money(result.contribution)}. Quoted margin ${result.margin.toFixed(2)} percent. ${budgetMessage.textContent}`;
      }, 250);
    } catch (error) {
      errorBox.hidden = false; errorBox.textContent = error.message || 'Please check the scenario inputs.';
      resultBox.hidden = true; costVisual.hidden = true; budgetMessage.hidden = true;
      clearTimeout(liveTimer); $('#lab-live').textContent = '';
    }
  }
  if (form) {
    form.addEventListener('input', refreshQuote);
    form.addEventListener('submit', event => event.preventDefault());
    $('#lab-reset')?.addEventListener('click', () => { form.reset(); refreshQuote(); });
    refreshQuote();
  }

  const demand = [100, 120, 110, 140, 130, 150];
  const forecasts = { baseline: [110, 110, 120, 120, 140, 130], candidate: [105, 118, 115, 132, 134, 143] };
  const svgNS = 'http://www.w3.org/2000/svg';
  function svgElement(name, attributes, text) {
    const element = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    if (text !== undefined) element.textContent = text;
    return element;
  }
  function renderForecast(selected) {
    const chart = $('#forecast-chart-content');
    if (!chart || !forecasts[selected]) return;
    const predicted = forecasts[selected];
    const label = selected === 'baseline' ? 'Baseline' : 'Candidate';
    const metrics = forecastMetrics(demand, predicted);
    $('#forecast-mae').textContent = metrics.mae.toFixed(2);
    $('#forecast-rmse').textContent = metrics.rmse.toFixed(2);
    $('#forecast-bias').textContent = `${metrics.bias >= 0 ? '+' : ''}${metrics.bias.toFixed(2)}`;
    $$('[data-forecast]').forEach(button => {
      const active = button.dataset.forecast === selected;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
    });
    $('#forecast-chart-desc').textContent = `All values are synthetic. Constructed demand: ${demand.join(', ')} units. ${label} forecast: ${predicted.join(', ')} units. MAE ${metrics.mae.toFixed(2)}, RMSE ${metrics.rmse.toFixed(2)} and bias ${metrics.bias.toFixed(2)} units.`;
    chart.replaceChildren();
    const left = 45, right = 703, top = 18, bottom = 200;
    const x = index => left + (right - left) * index / 5;
    const y = value => top + (160 - value) / 80 * (bottom - top);
    [80, 100, 120, 140, 160].forEach(value => {
      chart.append(svgElement('line', { x1: left, x2: right, y1: y(value), y2: y(value), stroke: '#e4dbe9', 'stroke-width': 1 }));
      chart.append(svgElement('text', { x: 34, y: y(value) + 4, 'text-anchor': 'end', fill: '#81738c', 'font-size': 11, 'font-family': 'sans-serif' }, value));
    });
    chart.append(svgElement('text', { x: 5, y: 10, fill: '#81738c', 'font-size': 10, 'font-family': 'sans-serif' }, 'units'));
    demand.forEach((_, index) => chart.append(svgElement('text', { x: x(index), y: 223, 'text-anchor': 'middle', fill: '#81738c', 'font-size': 11, 'font-family': 'sans-serif' }, `P${index + 1}`)));
    [[demand, '#6e8666', false, 'Constructed demand'], [predicted, '#9875b0', true, `${label} forecast`]].forEach(([series, colour, dashed, seriesLabel]) => {
      const line = svgElement('polyline', { points: series.map((value, i) => `${x(i)},${y(value)}`).join(' '), fill: 'none', stroke: colour, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      if (dashed) line.setAttribute('stroke-dasharray', '7 5');
      chart.append(line);
      series.forEach((value, i) => {
        const point = svgElement('circle', { cx: x(i), cy: y(value), r: 4, fill: dashed ? '#fffdfb' : colour, stroke: colour, 'stroke-width': 2 });
        point.append(svgElement('title', {}, `Period ${i + 1}, ${seriesLabel}: ${value} units (synthetic).`));
        chart.append(point);
      });
    });
  }
  $$('[data-forecast]').forEach(button => button.addEventListener('click', () => renderForecast(button.dataset.forecast)));
  renderForecast('baseline');
  $('#expand-roadmap')?.addEventListener('click', () => { $$('.roadmap-step').forEach(step => { step.open = true; }); });
  $('#collapse-roadmap')?.addEventListener('click', () => { $$('.roadmap-step').forEach(step => { step.open = false; }); });
})();
