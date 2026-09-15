# 2주차 — 지구 · 달 · 인공위성의 변환 설계

- 이름: 장예령
- 저장소: https://github.com/yeryoung-jang/cg-2026-solar
- 실행: [Task 1](task1.html) · [Task 2](task2.html) · [Task 3](task3.html)

## 변환 순서에 따른 움직임 비교

### 1. T를 Rz 앞으로 옮기면

'Rz - T - S'에서는 달을 지구에서 떨어뜨린 다음 회전시키므로 지구 주위를 공전합니다. 반면 'T - Rz - S'로 바꾸면 원점에서 먼저 회전한 다음 이동합니다. 따라서 달은 지구 주위를 돌지 않고 이동값으로 정한 위치에서 자전하게 됩니다. 하지만 구 모양만 보면 자전 여부를 구분하기 어려울 수 있습니다.

### 2. S를 맨 앞으로 옮기면

'Rz - T - S'를 'S - Rz - T'로 바꾸면 달의 크기뿐 아니라 지구에서 떨어진 거리에도 크기 배율이 적용됩니다. 따라서 달의 크기는 변경 전과 같지만 지구 중심에서 달 중심까지의 거리가 달라집니다. 배율이 1일 때는 크기 변환이 아무 변화도 주지 않으므로 순서를 바꿔도 차이가 없습니다.

### 3. 여섯 가지 순서 비교

| 행렬 배치 | 달의 움직임 |
| --- | --- |
| Rz - T - S | 반지름 r로 공전한다. |
| Rz - S - T | 반지름 s*r로 공전한다. |
| S - Rz - T | 반지름 s*r로 공전한다. |
| T - Rz - S | 중심 위치가 고정되고 자전한다. |
| T - S - Rz | 중심 위치가 고정되고 자전한다. |
| S - T - Rz | 이동 거리에도 크기 배율이 적용되며 그 위치에서 자전한다. |

지구 주위를 공전하는 움직임이 나타나는 순서는 세가지입니다. 다만 크기 배율이 1이 아닐 때, 달의 공전을 올바르게 표현하는 순서는 'Rz - T - S'입니다. 'Rz - S - T'와 'S - Rz - T'는 크기 배율이 공전 거리에도 영향을 줍니다.

## Task 1 - 실제 비율로 배치하기

### 조사한 값

| 항목 | 값 | 출처 |
| --- | ---| ---|
| 지구 반지름 | 6371km | https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html |
| 달 반지름 | 약 1740km | https://science.nasa.gov/moon/facts/ |
| 지구 중심에서 달 중심까지 평균 거리 | 384400 km | https://science.nasa.gov/moon/facts/ |
| 달 공전 주기 | 약 27일 | https://science.nasa.gov/moon/facts/ |
| 대상 위성 | 아리랑 3호 | https://www.kari.re.kr/eng/contents/160 |
| 위성 고도 | 685km | https://www.kari.re.kr/eng/contents/160 |
| 위성 크기 | 지름 2m, 높이 3m | https://www.kari.re.kr/eng/contents/160 |
| 위성 공전 주기 | 98.5분 | https://www.kari.re.kr/eng/contents/160 |
| 위성 궤도 경사각 | 98.1도 | https://www.kari.re.kr/eng/contents/160 |

### 단위를 정한 방법

단위는 '1'이 '1km'를 나타내도록 정했습니다. 조사한 지구와 달의 반지름, 위성의 고도를 실제 km 단위 그대로 입력하고 비교하기 위해서입니다. 아리랑 3호의 고도는 지표면을 기준으로 하기 때문에 지구 중심에서의 거리는 지구 반지름과 고도를 더한 '6371 + 685 = 7056km'로 계산했습니다. 지구 중심에서 달 중심까지의 거리와 달의 반지름을 달의 반지름을 합하면 386140km이므로 달 전체가 범위 안에 들어오도록 여유를 두고 x, y, z 축의 범위를 모두 '420000km'로 설정했습니다. 하지만 실제 비율을 유지하면 전체 화면에서 지구와 달이 작게 보이고 인공위성의 형태는 거의 보이지 않는다는 한계가 있었습니다. 시간은 't'가 '1' 증가할 때 1시간이 흐르는 것으로 설정했습니다. 달의 공전 주기는 약 27일이기 때문에 회전각을 't*360/(27*24)'로 설정했습니다. 아리랑 3호는 공전 주기 98.5분을 사용하므로 시간을 분으로 바꾼 't*60*360/98.5'를 회전각으로 설정했습니다. 지구와 달은 완전한 구로 표현하고 달과 위성은 일정한 속도로 움직이는 원 궤도로 단순화했습니다. 지구는 원점에 고정하고 자전은 표현하지 않았습니다. 달은 xy평면에서 공전하도록 설정했으며, 위성은 궤도 경사각을 반영해 궤도 평면을 x축 중심으로 98.1도 기울였습니다. 실제 위성의 지름과 높이를 조사했지만 실습에서는 위성 모형의 몸체 지름을 실제 지름인 2m(0.002km)에 맞추기 위해 '0.002/1.2'의 균등 크기 변환을 적용했습니다. 따라서 높이와 태양전지판까지 그대로 재현한 것은 아닙니다.

### 내가 넣은 변환

**공통 축 범위**

```json
{
  "range": {
    "x": "420000",
    "y": "420000",
    "z": "420000"
  }
}
```

**지구**

```json
{
  "id": "earth",
  "name": "지구",
  "color": [0.35, 0.6, 0.95],
  "steps": [
    {
      "type": "T",
      "args": ["0", "0", "0"]
    },
    {
      "type": "S",
      "args": ["6371", "6371", "6371"]
    }
  ]
}
```

지구는 전체 배치의 기준이므로 위치를 원점에 두었습니다. 지구의 반지름은 6371km이므로 크기값을 세 축 모두 6371로 맞췄습니다.

**달**

```json
{
  "id": "moon",
  "name": "달",
  "color": [0.78, 0.78, 0.82],
  "steps": [
    {
      "type": "Rz",
      "args": ["t*360/(27*24)"]
    },
    {
      "type": "T",
      "args": ["384400", "0", "0"]
    },
    {
      "type": "Rz",
      "args": ["180"]
    },
    {
      "type": "S",
      "args": ["1740", "1740", "1740"]
    }
  ]
}
```

달의 공전 주기가 약 27일이고 t의 단위가 시간이므로 회전각을 t*360/(27*24)로 설정했습니다. 행렬은 오른쪽부터 적용되므로 먼저 달의 반지름을 1740km로 맞추고 달의 +x 방향이 지구쪽을 향하게 하기 위해 Rz(180)으로 뒤집었습니다. 이후 T로 지구 중심에서 384400km 떨어뜨리고 시간에 따른 Rz를 적용하여 지구 주위를 공전하게 했습니다. 

**아리랑 3호**

```json
{
  "id": "sat",
  "name": "인공위성",
  "color": [0.95, 0.72, 0.35],
  "steps": [
    {
      "type": "Rx",
      "args": ["98.1"]
    },
    {
      "type": "Rz",
      "args": ["t*60*360/98.5"]
    },
    {
      "type": "T",
      "args": ["7056", "0", "0"]
    },
    {
      "type": "Rz",
      "args": ["180"]
    },
    {
      "type": "Su",
      "args": ["0.002/1.2"]
    }
  ]
}
```

아리랑 3호의 고도는 685km이지만 이동값에는 지구 중심에서의 거리를 넣어야 하므로 지구 반지름과 고도를 더한 7056km를 사용했습니다. 공전 주기는 98.5분이므로 t를 분으로 환산한 t*60을 이용해 회전각을 설정했습니다. 달과 마찬가지로 Rz(180)으로 위성의 +X 방향을 반대쪽으로 돌린 뒤 이동과 공전 회전을 적용했습니다. 마지막으로 가장 왼쪽에는 Rx(98.1)을 적용하여 궤도 경사각을 맞춰 기울였습니다. 이때 위성의 방향도 함께 회전하므로 +x가 지구 중심을 향하는 관계는 유지됩니다.

### 실제 비율에서 생긴 문제와 확인한 점

실제 값을 km 단위로 입력하니 크기와 거리의 차이가 매우 컸습니다. 달까지 포함하도록 축 범위를 420000으로 설정하자 지구와 달을 화면에서 아주 작게 볼 수 있었습니다. 특히 아리랑 3호는 지름이 0.002km에 불과해 전체 화면에서는 형태를 알아보기 어려웠습니다. 하지만 t 자동 증가를 설정했을 때, 상단에 표시되는 인공위성의 위치값이 계속 바뀌는 것을 보고 위치는 변하고 있다는 것을 확인했습니다. 다만 위치값이 바뀐다는 사실만으로 궤도나 방향까지 모두 올바르다고 판단할 수는 없었습니다. 인공위성이 지구를 향하는지 확인하는 과정에서 주황색 화살표가 여러 각도에서도 잘 보이지 않았습니다. 행렬 배치로는 Rz(180)이 물체의 x방향을 뒤집고 이후에 이동과 공전이 적용되어 지구쪽을 향하도록 구성했습니다. 그래서 위치가 움직이는 것은 확인할 수 있었지만 화면에서 직접 화살표의 방향을 확인하기는 어려웠습니다. 마지막 점검 과정에서 실행 링크를 내려받아 열어봤을 때는 화면을 아무리 확대축소를 해봐도 파란색으로만 보이는 문제도 있었습니다. AI의 도움을 받아 확인해본 결과, 카메라 거리와 확대축소 범위가 km 단위로 커진 장면에 맞지 않았습니다. 이 값을 장면의 범위에 맞게 수정한 파일을 다시 실행하자 전체가 보였습니다. 물체의 변환값뿐 아니라 카메라 설정도 장면의 크기에 맞아야 한다는 점을 알게 되었습니다.

![Task 1 결과](images/task1.png)

- 공유 링크: https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiNDIwMDAwIiwieSI6IjQyMDAwMCIsInoiOiI0MjAwMDAifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlQiLCJhcmdzIjpbIjAiLCIwIiwiMCJdfSx7InR5cGUiOiJTIiwiYXJncyI6WyI2MzcxIiwiNjM3MSIsIjYzNzEiXX1dfSx7ImlkIjoibW9vbiIsIm5hbWUiOiLri6wiLCJjb2xvciI6WzAuNzgsMC43OCwwLjgyXSwic3RlcHMiOlt7InR5cGUiOiJSeiIsImFyZ3MiOlsidCozNjAvKDI3KjI0KSJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyIzODQ0MDAiLCIwIiwiMCJdfSx7InR5cGUiOiJSeiIsImFyZ3MiOlsiMTgwIl19LHsidHlwZSI6IlMiLCJhcmdzIjpbIjE3NDAiLCIxNzQwIiwiMTc0MCJdfV19LHsiaWQiOiJzYXQiLCJuYW1lIjoi7J246rO17JyE7ISxIiwiY29sb3IiOlswLjk1LDAuNzIsMC4zNV0sInN0ZXBzIjpbeyJ0eXBlIjoiUngiLCJhcmdzIjpbIjk4LjEiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqNjAqMzYwLzk4LjUiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiNzA1NiIsIjAiLCIwIl19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyIxODAiXX0seyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjAuMDAyLzEuMiJdfV19XX0%3D

## Task 2 - NDC 범위에 맞추기

### 1. 배율을 정한 방법

공통 배율 S는 '1/390000'으로 정했습니다. 지구에서 가장 먼 물체는 달이므로 달의 중심까지의 거리뿐 아니라 달의 반지름도 포함해서 계산했습니다. 달의 바깥쪽까지의 거리는 '384400 + 1740 = 386140'입니다. 이보다 조금 큰 390000으로 나누면 가장 먼 지점도 0.9901이 되어 -1~1 범위 안에 들어옵니다. 따라서 세 물체에 같은 배율을 적용하고, 축 범위는 모두 1로 설정했습니다.

### 2. 배율 행렬을 맨 앞에 넣은 이유

변환은 오른쪽부터 적용되므로 새 배율 행렬을 가장 왼쪽에 넣으면 마지막에 적용됩니다. 이렇게 하면 Task 1에서 정한 물체의 크기와 지구에서 떨어진 거리가 함께 줄어듭니다. 반대로 가장 오른쪽에 넣으면 물체 자체의 크기만 먼저 줄어들고 이후 적용되는 이동값은 그대로 남습니다. 달의 경우 크기는 줄어도 지구에서 떨어진 거리는 여전히 384400이므로 장면 전체를 -1~1범위 안에 넣을 수 없습니다.

### 3. 세 물체에 같은 배율을 쓴 이유

Task 1에서 만든 실제 비율을 유지하기 위해 같은 배율을 사용했습니다. 지구, 달, 인공위성의 크기와 거리를 모두 같은 비율로 줄이면 서로의 크기 비율과 거리 관계가 유지되기 때문입니다. 물체마다 다른 배율을 적용하면 어떤 물체는 더 많이 줄어들고 다른 물체는 덜 줄어들어 처음에 조사한 실제 비율이 달라집니다.

### 4. 비율을 유지했을 때 보이는 모습

전체 배치를 범위 안에 넣으니 지구는 화면 가운데 작은 점처럼 보였고 인공위성은 거의 보이지 않았습니다. 지구 반지름은 배율을 적용한 뒤 약 '0.0163'이 되지만 위성의 몸체 지름은 약 '0.00000000513'이 되어 지구보다 훨씬 작기 때문입니다. t 자동증가를 설정했을 때 달과 인공위성의 상단 위치값이 바뀌는 것은 확인했습니다. 하지만 화면에서 직접 천체들의 크기와 움직임을 자세히 살펴보기는 어려웠습니다.

### 내가 넣은 변환

```json
{
  "range": {
    "x": "1",
    "y": "1",
    "z": "1"
  },
  "objects": [
    {
      "id": "earth",
      "name": "지구",
      "color": [
        0.35,
        0.6,
        0.95
      ],
      "steps": [
        {
          "type": "Su",
          "args": [
            "1/390000"
          ]
        },
        {
          "type": "T",
          "args": [
            "0",
            "0",
            "0"
          ]
        },
        {
          "type": "S",
          "args": [
            "6371",
            "6371",
            "6371"
          ]
        }
      ]
    },
    {
      "id": "moon",
      "name": "달",
      "color": [
        0.78,
        0.78,
        0.82
      ],
      "steps": [
        {
          "type": "Su",
          "args": [
            "1/390000"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*360/(27*24)"
          ]
        },
        {
          "type": "T",
          "args": [
            "384400",
            "0",
            "0"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "180"
          ]
        },
        {
          "type": "S",
          "args": [
            "1740",
            "1740",
            "1740"
          ]
        }
      ]
    },
    {
      "id": "sat",
      "name": "인공위성",
      "color": [
        0.95,
        0.72,
        0.35
      ],
      "steps": [
        {
          "type": "Su",
          "args": [
            "1/390000"
          ]
        },
        {
          "type": "Rx",
          "args": [
            "98.1"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "t*60*360/98.5"
          ]
        },
        {
          "type": "T",
          "args": [
            "7056",
            "0",
            "0"
          ]
        },
        {
          "type": "Rz",
          "args": [
            "180"
          ]
        },
        {
          "type": "Su",
          "args": [
            "0.002/1.2"
          ]
        }
      ]
    }
  ]
}
```

![Task 2 결과](images/task2.png)

- 공유 링크: https://cg.catholic.ac.kr/~mgchoi/CG/demos/d02-transform-lab.html?d=eyJyYW5nZSI6eyJ4IjoiMSIsInkiOiIxIiwieiI6IjEifSwib2JqZWN0cyI6W3siaWQiOiJlYXJ0aCIsIm5hbWUiOiLsp4DqtawiLCJjb2xvciI6WzAuMzUsMC42LDAuOTVdLCJzdGVwcyI6W3sidHlwZSI6IlN1IiwiYXJncyI6WyIxLzM5MDAwMCJdfSx7InR5cGUiOiJUIiwiYXJncyI6WyIwIiwiMCIsIjAiXX0seyJ0eXBlIjoiUyIsImFyZ3MiOlsiNjM3MSIsIjYzNzEiLCI2MzcxIl19XX0seyJpZCI6Im1vb24iLCJuYW1lIjoi64usIiwiY29sb3IiOlswLjc4LDAuNzgsMC44Ml0sInN0ZXBzIjpbeyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjEvMzkwMDAwIl19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyJ0KjM2MC8oMjcqMjQpIl19LHsidHlwZSI6IlQiLCJhcmdzIjpbIjM4NDQwMCIsIjAiLCIwIl19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyIxODAiXX0seyJ0eXBlIjoiUyIsImFyZ3MiOlsiMTc0MCIsIjE3NDAiLCIxNzQwIl19XX0seyJpZCI6InNhdCIsIm5hbWUiOiLsnbjqs7XsnITshLEiLCJjb2xvciI6WzAuOTUsMC43MiwwLjM1XSwic3RlcHMiOlt7InR5cGUiOiJTdSIsImFyZ3MiOlsiMS8zOTAwMDAiXX0seyJ0eXBlIjoiUngiLCJhcmdzIjpbIjk4LjEiXX0seyJ0eXBlIjoiUnoiLCJhcmdzIjpbInQqNjAqMzYwLzk4LjUiXX0seyJ0eXBlIjoiVCIsImFyZ3MiOlsiNzA1NiIsIjAiLCIwIl19LHsidHlwZSI6IlJ6IiwiYXJncyI6WyIxODAiXX0seyJ0eXBlIjoiU3UiLCJhcmdzIjpbIjAuMDAyLzEuMiJdfV19XX0%3D