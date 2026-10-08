/* 학생 확장 시작점. 여기에 본인이 설계한 관찰 인터페이스를 구현하세요.
   제공 기준 버전은 이 파일을 비워 둔 상태입니다.

   const viewer = window.InspectionViewer;
   viewer.controls.state: target, distance, rotation(쿼터니언), fov
   viewer.controls.camera(): 현재 eye/target/up
   viewer.controls.home(): 기본 카메라로 복귀
   viewer.model.poi: 주요 지점의 id/name/position/size/yaw/group
   viewer.model.comparisons: O1/O2 비교 대상 members와 관찰 방향 viewDirection
   viewer.model.tasks: 표지 관찰 6건 + 직교 비교 2건
   viewer.hidden: 일시적으로 숨길 id 또는 group을 담는 Set
   viewer.drawView({eye,target,up,fov,orthographic,halfHeight}, [x,y,w,h])
     : viewport는 CSS 픽셀이 아닌 canvas.width/height 기준, 원점은 왼쪽 아래
   viewer.render = (viewer) => { ... } : 기본 한 화면 그리기를 대체할 선택적 콜백
   document.querySelector('#student-ui'): 본인이 만든 UI를 넣을 자리

   기본 이벤트를 바꾸려면 d04-inspection-controls.js를 수정해도 됩니다.
   중요한 정보는 실제 구조물과 함께 관찰하도록 하고, 답만 목록에 표시하지 마세요.
*/

// ============================================================
// Week 4 - 관찰 인터페이스
// ============================================================

const viewer = window.InspectionViewer;
const ui = document.querySelector('#student-ui');

if (!viewer || !ui) {
  console.error('InspectionViewer 또는 student-ui를 찾을 수 없습니다.');
} else {

  // ----------------------------------------------------------
  // 1. 학생용 관찰 UI
  // ----------------------------------------------------------

  ui.innerHTML = `
    <div class="inspection-panel">
      <div class="inspection-title">관찰 도우미</div>

      <div class="inspection-status" id="inspection-status">
        현재 관찰: 자유 탐색
      </div>

      <div class="inspection-section">
        <strong>명판 검사</strong>
        <div class="inspection-buttons">
          <button data-poi="P1">P1</button>
          <button data-poi="P2">P2</button>
          <button data-poi="P3">P3</button>
          <button data-poi="P4">P4</button>
          <button data-poi="P5">P5</button>
          <button data-poi="P6">P6</button>
        </div>
      </div>

      <div class="inspection-section">
        <strong>비교 모드</strong>
        <div class="inspection-buttons">
          <button id="compare-o1">O1 전면 비교</button>
          <button id="compare-o2">O2 측면 비교</button>
        </div>
      </div>

      <div class="inspection-section">
        <button id="inspection-home">전체 보기</button>
      </div>
    </div>
  `;

  // ----------------------------------------------------------
  // 2. 간단한 스타일
  // ----------------------------------------------------------

  const style = document.createElement('style');

  style.textContent = `
    .inspection-panel {
      margin-top: 12px;
      padding: 14px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      background: #f8fafc;
      font-family: sans-serif;
    }

    .inspection-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .inspection-status {
      padding: 8px 10px;
      margin-bottom: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #dbe3ec;
    }

    .inspection-section {
      margin-top: 10px;
    }

    .inspection-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
    }

    .inspection-panel button {
      padding: 7px 11px;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      background: white;
      cursor: pointer;
    }

    .inspection-panel button:hover {
      background: #e2e8f0;
    }
  `;

  document.head.appendChild(style);

  const status = document.querySelector('#inspection-status');

  // 현재 포커스 렌즈를 사용할 관찰 지점
  let focusLensPoi = null;

  // ----------------------------------------------------------
  // 포커스 렌즈용 카메라
  // 명판의 yaw를 이용해 명판 바로 앞에서 정면으로 바라본다.
  // ----------------------------------------------------------

  function makeLensCamera(poi) {
   const distance = 1.2;

   // yaw 방향으로 명판 앞쪽에 카메라를 배치
   const eye = [
     poi.position[0] + Math.sin(poi.yaw) * distance,
     poi.position[1],
     poi.position[2] + Math.cos(poi.yaw) * distance
    ];

    return {
      eye,
      target: [...poi.position],
      up: [0, 1, 0],
      fov: 32
    };
  }

  // ----------------------------------------------------------
  // 메인 화면 + 오른쪽 위 포커스 렌즈
  // ----------------------------------------------------------

  function renderWithFocusLens(v) {
    // 메인 화면은 항상 기존 트랙볼 카메라를 사용한다.
    // 따라서 P5에서도 휠 확대/축소, 회전, 평행 이동이 그대로 가능하다.
    v.drawView(v.controls.camera());

    if (!focusLensPoi) return;

    // 오른쪽 위 포커스 렌즈
    const w = v.canvas.width;
    const h = v.canvas.height;

    const lensWidth = Math.round(w * 0.30);
    const lensHeight = Math.round(h * 0.30);

    const margin = Math.round(
      20 * Math.min(window.devicePixelRatio || 1, 2)
    );

    const viewport = [
      w - lensWidth - margin,
      h - lensHeight - margin,
      lensWidth,
      lensHeight
    ];

    // 포커스 렌즈만 명판 가까이에서 고정해서 보여준다.
    v.drawView(
      makeLensCamera(focusLensPoi),
      viewport
    );
  }

  // ----------------------------------------------------------
  // 지정한 명판을 정면에서 관찰
  // ----------------------------------------------------------

  function focusPoi(id) {
    const poi = viewer.model.poi.find((p) => p.id === id);

    if (!poi) {
      console.error(`${id} 정보를 찾을 수 없습니다.`);
      return;
    }

    // 다른 관찰에서 숨겼던 구조물이 있다면 먼저 복원
    viewer.hidden.clear();

    // 명판의 중심을 카메라가 바라보는 지점으로 설정
    viewer.controls.state.target = [...poi.position];

    // 관찰 지점별로 명판과 주변 구조가 함께 보이는 거리
    const focusDistance = {
  P1: 5.0,
  P2: 3.0,
  P3: 1.8,
  P4: 3.2,
  P5: 11.0,
  P6: 2.2
    };

    viewer.controls.state.distance = focusDistance[id] ?? 3.0;
    
    // yaw 방향을 이용해 명판의 정면에 카메라 배치
    const halfYaw = poi.yaw / 2;

    viewer.controls.state.rotation = [
     0,
     Math.sin(halfYaw),
     0,
     Math.cos(halfYaw)
    ];

    // 너무 넓은 시야보다 명판 확인에 적당한 시야각 사용
    viewer.controls.state.fov = 40;

    // P5에서는 포커스 렌즈를 함께 사용한다.
  if (id === 'P5') {
    focusLensPoi = poi;
    viewer.render = renderWithFocusLens;
  } else {
    focusLensPoi = null;
    viewer.render = null;
  }

   status.textContent = `현재 관찰: ${poi.id} — ${poi.name}`;
  }

  // ----------------------------------------------------------
  // O1 / O2 직교 비교 모드
  // ----------------------------------------------------------

  function showComparison(id) {
    const comparison = viewer.model.comparisons.find(
      (item) => item.id === id
    );

    if (!comparison) {
      console.error(`${id} 비교 정보를 찾을 수 없습니다.`);
      return;
    }

    // P5 포커스 렌즈 등 이전 관찰 상태 해제
    focusLensPoi = null;
    viewer.hidden.clear();

    // 비교에 필요하지 않은 P1~P6 명판은 잠시 숨긴다.
    viewer.model.poi.forEach((poi) => {
      viewer.hidden.add(poi.id);
    });

    // 비교와 관계없는 내부 물체는 잠시 숨긴다.
    viewer.hidden.add('furniture');
    viewer.hidden.add('equipment');

    const dir = comparison.viewDirection;
    const distance = 20;

    // 교수님이 제공한 viewDirection을 이용해
    // 정확한 정면/측면 위치에 카메라를 둔다.
    const eye = [
      comparison.position[0] - dir[0] * distance,
      comparison.position[1] - dir[1] * distance,
      comparison.position[2] - dir[2] * distance
    ];

    // 화면 아래 표시되는 회전 중심도 현재 비교 대상으로 맞춘다.
    viewer.controls.state.target = [...comparison.position];
    viewer.controls.state.distance = distance;

    const comparisonCamera = {
      eye: eye,
      target: [...comparison.position],
      up: [0, 1, 0],

      // 원근 효과 제거
      orthographic: true,

      // 두 비교 대상이 한 화면에 들어오도록 범위 설정
      halfHeight: id === 'O1' ? 1.5 : 1.6
    };

    viewer.render = (v) => {
      v.drawView(comparisonCamera);
    };

    status.textContent =
    ` 현재 관찰: ${comparison.id} — ${comparison.name} · 직교 투영 · 관련 없는 명판/가구/장비 숨김 · 전체 보기에서 복원`;
  }

  // ----------------------------------------------------------
  // 3. P1 ~ P6 버튼
  // 선택한 지점으로 카메라를 자동 이동한다.
  // ----------------------------------------------------------

  document.querySelectorAll('[data-poi]').forEach((button) => {
    button.addEventListener('click', () => {
      viewer.controls.state.actions++;

      const id = button.dataset.poi;
      focusPoi(id);
    });
  });

  // ----------------------------------------------------------
  // 4. 비교 버튼
  // 직교 투영은 다음 단계에서 구현한다.
  // ----------------------------------------------------------

  document.querySelector('#compare-o1').addEventListener('click', () => {
    viewer.controls.state.actions++;
    showComparison('O1');
  });

  document.querySelector('#compare-o2').addEventListener('click', () => {
    viewer.controls.state.actions++;
    showComparison('O2');
  });

  // ----------------------------------------------------------
  // 5. 전체 보기
  // ----------------------------------------------------------

  document.querySelector('#inspection-home').addEventListener('click', () => {
    viewer.controls.home();

    viewer.hidden.clear();

    focusLensPoi = null;
    viewer.render = null;

    status.textContent = '현재 관찰: 자유 탐색';
  });

  // 교수님 기본 '전체 보기' 버튼을 눌렀을 때도
  // 포커스 렌즈와 사용자 모드를 함께 종료한다.
  document.querySelector('#home')?.addEventListener('click', () => {
    focusLensPoi = null;
    viewer.render = null;
    viewer.hidden.clear();

    status.textContent = '현재 관찰: 자유 탐색';
  });

  // 키보드 Home을 눌렀을 때도 사용자 모드를 종료한다.
  viewer.canvas.addEventListener('keydown', (event) => {
    if (event.key !== 'Home') return;

    focusLensPoi = null;
    viewer.render = null;
    viewer.hidden.clear();

    status.textContent = '현재 관찰: 자유 탐색';
  });
}