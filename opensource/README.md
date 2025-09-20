# TickPay 오픈소스 기술 스택

> **TickPay A2A 시스템에서 사용된 모든 오픈소스 기술들의 상세 목록**

## 📋 개요

TickPay A2A는 현대적인 웹 기술과 블록체인 기술을 결합하여 구축된 Agent-to-Agent 자율 결제 시스템입니다. 모든 핵심 기능은 검증된 오픈소스 라이브러리와 프레임워크를 기반으로 개발되었습니다.

---

## 🏗️ 프로젝트 아키텍처

### Monorepo 구조
```
tickpay/
├── apps/
│   ├── web/          # Next.js 웹 애플리케이션
│   └── api/          # Express.js API 서버
└── packages/
    ├── oracle-sdk/   # 사용량 측정 SDK
    └── xrpl-kit/     # XRPL 유틸리티 패키지
```

---

## 🎯 프론트엔드 기술 스택

### 🔧 핵심 프레임워크 & 런타임

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **React** | 19.1.0 | MIT | UI 라이브러리 | https://react.dev |
| **Next.js** | 15.5.3 | MIT | React 풀스택 프레임워크 | https://nextjs.org |
| **TypeScript** | ^5 | Apache-2.0 | 타입 안전성 | https://typescriptlang.org |
| **Node.js** | ^20 | MIT | JavaScript 런타임 | https://nodejs.org |

### 🎨 UI & 스타일링

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **Tailwind CSS** | ^4 | MIT | 유틸리티 기반 CSS 프레임워크 | https://tailwindcss.com |
| **Radix UI** | ^1.2.x | MIT | 접근성 중심 UI 컴포넌트 | https://radix-ui.com |
| **Lucide React** | ^0.544.0 | ISC | SVG 아이콘 라이브러리 | https://lucide.dev |
| **Class Variance Authority** | ^0.7.1 | Apache-2.0 | 타입 안전 CSS 클래스 관리 | https://cva.style |

### 🔧 유틸리티 라이브러리

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **clsx** | ^2.1.1 | MIT | 조건부 CSS 클래스 결합 | https://github.com/lukeed/clsx |
| **tailwind-merge** | ^3.3.1 | MIT | Tailwind 클래스 충돌 해결 | https://github.com/dcastil/tailwind-merge |
| **Sonner** | ^2.0.7 | MIT | React 토스트 알림 | https://sonner.emilkowal.ski |

---

## 🌐 블록체인 & XRPL 기술

### 💎 XRPL 핵심 라이브러리

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **xrpl** | ^4.4.1 | ISC | XRPL 메인 SDK | https://js.xrpl.org |
| **ripple-binary-codec** | ^2.5.0 | ISC | XRPL 트랜잭션 인코딩/디코딩 | https://github.com/XRPLF/xrpl.js |
| **ripple-keypairs** | ^2.0.0 | ISC | XRPL 키페어 생성 및 관리 | https://github.com/XRPLF/xrpl.js |

### 🔗 지갑 연동

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **xumm-sdk** | ^1.8.1 | MIT | Xaman(구 XUMM) 지갑 연동 | https://xumm.app |
| **qrcode** | ^1.5.3 | MIT | QR 코드 생성 | https://github.com/soldair/node-qrcode |

---

## 🚀 백엔드 기술 스택

### 🔧 서버 프레임워크

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **Express.js** | ^4.21.2 | MIT | Node.js 웹 프레임워크 | https://expressjs.com |
| **CORS** | ^2.8.5 | MIT | Cross-Origin Resource Sharing | https://github.com/expressjs/cors |
| **Helmet** | ^7.0.0 | MIT | Express.js 보안 미들웨어 | https://helmetjs.github.io |

### 🔐 보안 & 인증

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **jsonwebtoken** | ^9.0.2 | MIT | JWT 토큰 생성/검증 | https://github.com/auth0/node-jsonwebtoken |
| **bcrypt** | ^5.1.0 | MIT | 비밀번호 해싱 | https://github.com/kelektiv/node.bcrypt.js |
| **express-rate-limit** | ^6.8.1 | MIT | API 요청 제한 | https://github.com/express-rate-limit/express-rate-limit |
| **express-validator** | ^7.0.1 | MIT | 입력 데이터 검증 | https://express-validator.github.io |

### 📊 데이터베이스 & 로깅

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **SQLite3** | ^5.1.6 | BSD-3-Clause | 경량 데이터베이스 | https://sqlite.org |
| **Winston** | ^3.10.0 | MIT | 로깅 라이브러리 | https://github.com/winstonjs/winston |
| **dotenv** | ^16.3.1 | BSD-2-Clause | 환경 변수 관리 | https://github.com/motdotla/dotenv |

---

## 🤖 AI & 서비스 통합

### 🧠 AI 모델 통합

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **OpenAI** | ^5.20.2 | Apache-2.0 | OpenAI API 클라이언트 | https://platform.openai.com |

---

## 🛠️ 개발 도구 & 빌드 시스템

### 📦 빌드 & 번들링

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **Turbopack** | (Next.js 내장) | MPL-2.0 | 고성능 번들러 | https://turbo.build |
| **TSX** | ^3.14.0 | MIT | TypeScript 실행기 | https://github.com/esbuild-kit/tsx |
| **Concurrently** | ^8.2.2 | MIT | 동시 스크립트 실행 | https://github.com/open-cli-tools/concurrently |

### 🔍 코드 품질 & 테스팅

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **ESLint** | ^9 | MIT | JavaScript/TypeScript 린터 | https://eslint.org |
| **Jest** | ^29.6.1 | MIT | JavaScript 테스팅 프레임워크 | https://jestjs.io |

### 📝 타입 정의

| 기술 | 버전 | 라이선스 | 용도 | 공식 사이트 |
|------|------|---------|------|------------|
| **@types/node** | ^20 | MIT | Node.js 타입 정의 | https://github.com/DefinitelyTyped/DefinitelyTyped |
| **@types/react** | ^19 | MIT | React 타입 정의 | https://github.com/DefinitelyTyped/DefinitelyTyped |
| **@types/express** | ^4.17.17 | MIT | Express.js 타입 정의 | https://github.com/DefinitelyTyped/DefinitelyTyped |

---

## 📦 커스텀 패키지

### 🔮 @tickpay/oracle-sdk

**용도**: AI 에이전트 사용량 측정 및 증명 시스템

**핵심 의존성**:
- `jsonwebtoken`: JWT 기반 사용량 클레임 생성
- `crypto`: 암호화 유틸리티

### 🌊 @tickpay/xrpl-kit

**용도**: XRPL 결제 채널 및 트랜잭션 유틸리티

**핵심 의존성**:
- `xrpl`: XRPL 네트워크 연동
- `ripple-binary-codec`: 트랜잭션 인코딩
- `ripple-keypairs`: 키페어 관리

---

## 🎯 핵심 XRPL 기능 구현

### 🔐 Credential System
```typescript
// xrpl 라이브러리를 사용한 신뢰 검증
TransactionType: "CredentialCreate"
TransactionType: "CredentialAccept"
TransactionType: "CredentialDelete"
```

### 💰 Payment System
```typescript
// 개별 XRP Payment (60%)
TransactionType: "Payment"

// Batch Transaction (40%)
TransactionType: "Batch"
Flags: 0x00020000 // OnlyOne
```

### 🌐 Real-time Monitoring
```typescript
// WebSocket 연결 via xrpl 라이브러리
const client = new Client("wss://s.devnet.rippletest.net:51233");
```

---

## 📊 라이선스 분석

### 라이선스별 패키지 분포

| 라이선스 | 패키지 수 | 주요 패키지 |
|----------|-----------|------------|
| **MIT** | 25+ | React, Next.js, Express.js, TypeScript 등 |
| **ISC** | 4 | xrpl, ripple-binary-codec, ripple-keypairs |
| **Apache-2.0** | 3 | TypeScript, OpenAI, Class Variance Authority |
| **BSD** | 2 | SQLite3, dotenv |
| **MPL-2.0** | 1 | Turbopack |

### 🔒 라이선스 호환성
- 모든 사용된 라이선스는 **상업적 사용 허용**
- 대부분이 **MIT 라이선스**로 제한 없는 사용 가능
- **ISC 라이선스** (XRPL 관련): MIT와 호환성 있음
- 모든 패키지가 **오픈소스 프로젝트에 적합**

---

## 🚀 배포 & 운영

### 📈 성능 최적화
- **Turbopack**: Next.js 15의 고성능 번들러
- **React 19**: 최신 React 동시성 기능
- **TypeScript**: 컴파일 타임 최적화

### 🔒 보안 기능
- **Helmet**: Express.js 보안 헤더
- **bcrypt**: 안전한 패스워드 해싱
- **express-rate-limit**: DDoS 방지
- **express-validator**: 입력 검증

### 📊 모니터링
- **Winston**: 구조화된 로깅
- **CORS**: 안전한 크로스오리진 요청

---

## 🌟 기술 선택 기준

### 1. **성숙도 & 안정성**
- React, Next.js, Express.js 등 검증된 기술 선택
- 활발한 커뮤니티와 장기 지원

### 2. **XRPL 생태계 호환성**
- 공식 XRPL 라이브러리 사용
- Ripple 재단 관리 패키지 우선 선택

### 3. **개발자 경험**
- TypeScript 완전 지원
- 현대적 개발 도구 체인
- Hot Reload & Fast Refresh

### 4. **확장성**
- Monorepo 아키텍처
- 모듈화된 패키지 구조
- 마이크로서비스 지향 설계

---

## 📚 참고 자료

### 🔗 공식 문서
- [XRPL.js Documentation](https://js.xrpl.org)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://typescriptlang.org/docs)

### 🧪 샘플 코드
- [XRPL Code Samples](https://github.com/XRPLF/xrpl-dev-portal)
- [Next.js Examples](https://github.com/vercel/next.js/tree/main/examples)

### 🛠️ 개발 가이드
- [XRPL Transaction Types](https://xrpl.org/transaction-types.html)
- [React Best Practices](https://react.dev/learn)

---

## 🤝 오픈소스 기여

TickPay A2A는 오픈소스 생태계의 혜택을 받아 개발되었습니다. 사용된 모든 오픈소스 프로젝트에 감사드리며, 향후 TickPay도 오픈소스 생태계에 기여할 계획입니다.

### 🙏 감사 인사
- **Ripple Foundation**: XRPL 인프라 제공
- **Vercel**: Next.js 프레임워크 개발
- **Meta**: React 라이브러리 개발
- **OpenJS Foundation**: Node.js 및 다양한 프로젝트 지원
- **모든 오픈소스 기여자들**: 훌륭한 도구들을 만들어주신 모든 개발자분들

---

**TickPay A2A - AI (에이전트) 페이먼트 프로토콜** 🤖⚡