/*
 * Demo behavior for the static copy of Registro red de votantes.
 *
 * The pages are the real app's screens; this script stands in for the server:
 * logins, registrations and cedula checks are simulated in the browser with
 * fictional results. Nothing is sent anywhere. The visitor's registration is
 * kept only in this browser (localStorage) to show it on the next page.
 */
(function () {
  'use strict';

  var page = document.body.dataset.demoPage;
  var KEY = 'rrv-demo-registro';

  var PLACES = [
    ['BOGOTA D.C.', 'BOGOTA D.C.', 'COLEGIO LA ESPERANZA', 'KR 80 # 12-40', '9'],
    ['BOGOTA D.C.', 'BOGOTA D.C.', 'PARQUE CENTRAL KENNEDY', 'CL 41 SUR # 78-30', '4'],
    ['CUNDINAMARCA', 'SOACHA', 'COLEGIO SAN MATEO', 'KR 7 # 32-18', '13'],
    ['BOYACA', 'TUNJA', 'INSTITUTO TECNICO DE TUNJA', 'CL 19 # 9-35', '6'],
  ];
  var placeIndex = 0;
  function nextPlace() { return PLACES[placeIndex++ % PLACES.length]; }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch (e) { return null; }
  }
  function save(value) {
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (e) { /* demo still works */ }
  }

  function toast(message, type) {
    var container = document.getElementById('demo-toasts');
    if (!container) {
      container = document.createElement('div');
      container.id = 'demo-toasts';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = 1090;
      document.body.appendChild(container);
    }
    var icon = type === 'warning' ? 'bi-exclamation-circle text-warning' : 'bi-check-circle text-success';
    var el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="toast-header"><i class="bi ' + icon + ' me-2"></i>' +
      '<strong class="me-auto">' + (type === 'warning' ? 'Aviso' : 'Éxito') + '</strong>' +
      '<button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Cerrar"></button></div>' +
      '<div class="toast-body"></div>';
    el.querySelector('.toast-body').textContent = message;
    container.appendChild(el);
    new bootstrap.Toast(el, { delay: 3500 }).show();
  }

  /* ---------- Census card (Mi perfil) ---------- */

  var VERIFYING =
    '<span class="badge bg-info"><span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Verificando cédula...</span>' +
    '<p class="text-muted mb-0 mt-2">Consultando con la Registraduría Nacional. Esto puede tomar unos momentos.</p>';

  function verifiedHtml(place, labelCols) {
    var cols = labelCols || ['col-sm-4', 'col-sm-8'];
    var names = ['Departamento', 'Municipio', 'Puesto de votación', 'Dirección', 'Mesa'];
    var rows = names.map(function (name, i) {
      return '<dt class="' + cols[0] + '">' + name + '</dt><dd class="' + cols[1] + '">' + place[i] + '</dd>';
    }).join('');
    return '<dl class="row mb-0">' + rows + '</dl>';
  }

  function demoNote() {
    return '<p class="small text-primary mt-2 mb-0"><i class="bi bi-info-circle"></i> ' +
      'Demo: en la aplicación real este dato sale de la consulta pública de la Registraduría.</p>';
  }

  function showVerified(status, place) {
    status.dataset.polling = 'false';
    status.innerHTML =
      '<span class="badge bg-success mb-3"><i class="bi bi-check-circle"></i> Verificado</span>' +
      verifiedHtml(place) +
      '<p class="text-muted small mb-0 mt-3"><i class="bi bi-clock"></i> Verificado: hace un momento</p>' +
      demoNote();
  }

  function setupProfile() {
    var status = document.getElementById('census-status');
    var refresh = document.querySelector('#census-section button[hx-post]');
    if (refresh && status) {
      refresh.addEventListener('click', function () {
        var original = status.innerHTML;
        refresh.disabled = true;
        status.innerHTML = VERIFYING;
        setTimeout(function () {
          status.innerHTML = original;
          refresh.disabled = false;
          toast('Datos electorales actualizados');
        }, 4000);
      });
    }
    if (location.search.indexOf('clave=1') !== -1) toast('Contraseña cambiada correctamente');
  }

  function setupNewProfile() {
    var person = load();
    if (person) {
      var cedula = document.querySelector('input.form-control-plaintext');
      if (cedula) cedula.value = person.cedula;
      var nombre = document.getElementById('id_nombre_completo');
      if (nombre) nombre.value = person.nombre;
      var phone = document.getElementById('id_phone');
      if (phone) phone.value = person.phone;
    }
    var status = document.getElementById('census-status');
    if (!status) return;
    status.innerHTML = VERIFYING;
    status.insertAdjacentHTML('beforeend',
      '<p class="small text-primary mt-2 mb-0"><i class="bi bi-hourglass-split"></i> ' +
      'Demo: en unos segundos verá el resultado, sin recargar la página.</p>');
    setTimeout(function () {
      showVerified(status, PLACES[0]);
      toast('Cédula verificada');
    }, 7000);
  }

  /* ---------- Mis referidos ---------- */

  var BADGES = {
    ACTIVE: '<span class="badge bg-success"><i class="bi bi-check-circle"></i> Encontrado</span>',
    PENDING: '<span class="badge bg-warning text-dark"><span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Pendiente</span>',
    NOT_FOUND: '<span class="badge bg-secondary"><i class="bi bi-dash-circle"></i> No encontrado</span>',
  };

  function setRowStatus(id, status, place) {
    var row = document.getElementById('row-' + id);
    var detail = document.getElementById('detail-' + id);
    if (!row) return;
    row.dataset.status = status;
    var cells = row.querySelectorAll('td');
    cells[cells.length - 1].innerHTML = BADGES[status] + ' <i class="bi bi-chevron-right toggle-icon ms-2"></i>';
    if (status === 'ACTIVE') {
      cells[0].innerHTML = '';
      if (detail) {
        detail.querySelector('td').innerHTML =
          '<div class="p-3"><h6 class="mb-3"><i class="bi bi-geo-alt"></i> Información Electoral</h6>' +
          verifiedHtml(place, ['col-sm-3', 'col-sm-9']) +
          '<p class="text-muted small mb-0 mt-2"><i class="bi bi-clock"></i> hace un momento</p>' +
          demoNote() + '</div>';
      }
    }
  }

  function reapplyFilter() {
    var active = document.querySelector('[data-filter].active');
    if (active && window.filterTable) window.filterTable(active.dataset.filter);
  }

  function recheck(id) {
    var row = document.getElementById('row-' + id);
    if (!row) return;
    var before = row.dataset.status;
    var name = row.dataset.name;
    setRowStatus(id, 'PENDING');
    setTimeout(function () {
      if (before === 'NOT_FOUND') {
        setRowStatus(id, 'NOT_FOUND');
        var checkbox = row.querySelector('.referral-checkbox');
        if (checkbox) checkbox.checked = false;
        toast(name + ': la cédula sigue sin aparecer en el censo electoral', 'warning');
      } else {
        setRowStatus(id, 'ACTIVE', nextPlace());
        toast(name + ': cédula verificada');
      }
      if (window.updateBulkButton) window.updateBulkButton();
      reapplyFilter();
    }, 4500);
  }

  function setupReferrals() {
    // Rows that were still being checked finish on their own, as in the app
    var pending = document.querySelectorAll('.referral-row[data-status="PROCESSING"], .referral-row[data-status="PENDING"]');
    pending.forEach(function (row, i) {
      setTimeout(function () {
        setRowStatus(row.dataset.id, 'ACTIVE', nextPlace());
        reapplyFilter();
        toast(row.dataset.name + ': cédula verificada');
      }, 6000 + i * 5000);
    });

    document.querySelectorAll('.detail-row button[hx-post]').forEach(function (button) {
      button.addEventListener('click', function (event) {
        event.stopPropagation();
        var id = button.closest('.detail-row').id.replace('detail-', '');
        button.disabled = true;
        recheck(id);
        setTimeout(function () { button.disabled = false; }, 4600);
      });
    });
  }

  function bulkRefresh(form) {
    var ids = Array.prototype.map.call(form.querySelectorAll('.referral-checkbox:checked'), function (cb) { return cb.value; }).slice(0, 10);
    if (!ids.length) { toast('No se seleccionaron usuarios', 'warning'); return; }
    toast('Consultando ' + ids.length + (ids.length === 1 ? ' cédula' : ' cédulas') + ' de nuevo');
    ids.forEach(recheck);
  }

  /* ---------- Login hint ---------- */

  function setupLogin() {
    var form = document.querySelector('form');
    if (!form) return;
    form.insertAdjacentHTML('afterbegin',
      '<div class="alert alert-info small py-2"><i class="bi bi-info-circle"></i> ' +
      'Demo: escriba cualquier cédula (6 a 10 números) y cualquier contraseña. Entrará como la líder de ejemplo.</div>');
  }

  /* ---------- Forms: run after the page's own validation ---------- */

  document.addEventListener('submit', function (event) {
    if (event.defaultPrevented) return;
    var form = event.target;
    event.preventDefault();

    if (form.getAttribute('action') === 'login.html') { location.href = 'login.html'; return; }

    switch (page) {
      case 'login':
        location.href = 'inicio.html';
        break;
      case 'registro':
        save({
          cedula: form.querySelector('#id_cedula').value,
          nombre: form.querySelector('#id_nombre_completo').value,
          phone: form.querySelector('#id_phone').value,
        });
        location.href = 'perfil-nuevo.html';
        break;
      case 'perfil':
      case 'perfil-nuevo':
        toast('Perfil actualizado correctamente');
        break;
      case 'cambiar-password':
        var fields = form.querySelectorAll('input[type=password]');
        var filled = Array.prototype.every.call(fields, function (f) { return f.value !== ''; });
        if (!filled || fields[fields.length - 1].value !== fields[fields.length - 2].value) {
          toast('Escriba su contraseña actual y la nueva dos veces, igual en ambas casillas', 'warning');
          return;
        }
        location.href = 'perfil.html?clave=1';
        break;
      case 'referidos':
        bulkRefresh(form);
        break;
    }
  });

  if (page === 'login') setupLogin();
  if (page === 'perfil') setupProfile();
  if (page === 'perfil-nuevo') setupNewProfile();
  if (page === 'referidos') setupReferrals();
})();
