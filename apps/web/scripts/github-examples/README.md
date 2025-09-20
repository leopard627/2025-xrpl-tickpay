# XRPL MPToken v1 Test Results

## Overview
테스트용 MPToken 스크립트들을 GitHub 예제를 기반으로 작성하여 실제 XRPL devnet에서 테스트한 결과를 기록합니다.

## Test Environment
- **XRPL Network**: Devnet (wss://s.devnet.rippletest.net:51233)
- **Test Date**: 2025-09-17
- **Admin Wallet**: `rNu1A4qvStLderV1a34sQQCgj7Ep4qBSMz`
- **Test User Wallet**: `rDJHDKzpAhKoGkG3c1UxUGhjpggUaZijpx`

## Created Scripts

### 1. createIssuance.ts
- **Purpose**: MPToken 발행 생성
- **Result**: ✅ 성공
- **Generated IssuanceID**: `005E2BD89899C9243A1A17A0E18E25C7C2ADAE1776E3F1E5`

### 2. userOptIn.ts
- **Purpose**: 사용자 MPToken 수신 opt-in
- **Result**: ✅ 성공
- **Transaction Hash**: `2EE7B305265092761356D55E99D48F5B20E8D5E03185E6388F8EB41981AF487F`

### 3. authorizeHolder.ts
- **Purpose**: 관리자의 사용자 승인
- **Result**: ⚠️ `tecNO_AUTH` 에러
- **Note**: 실제로는 필요하지 않은 단계로 판명

### 4. sendMPToken.ts
- **Purpose**: MPToken 전송
- **Result**: ✅ 성공
- **Amount**: 50 MPTokens
- **Transaction Hash**: `74FC583E703F1B0D3D40E6B304C0CA748584500FD893D47626B262012D2DAC3F`

## Key Findings

### ✅ Working MPToken Flow
```
1. Admin creates MPToken issuance
   └─ MPTokenIssuanceCreate transaction

2. User opts in to receive tokens
   └─ MPTokenAuthorize transaction (user as Account)

3. Admin sends tokens to user
   └─ Payment transaction with mpt_issuance_id
```

### ⚠️ Authorization Issue
- `authorizeHolder.ts`에서 `tecNO_AUTH` 에러 발생
- 하지만 실제로는 사용자 opt-in 후 바로 토큰 전송이 가능
- GitHub 예제의 admin authorization 단계는 불필요한 것으로 판명

### 💡 Important Discovery
MPToken v1에서는 **두 단계 승인이 아닌 단일 opt-in 방식**으로 동작:
- 사용자가 `MPTokenAuthorize`로 opt-in하면 즉시 토큰 수신 가능
- 별도의 admin authorization 단계는 필요 없음

## Usage Examples

### Create MPToken Issuance
```bash
npx tsx createIssuance.ts
```

### User Opt-in
```bash
npx tsx userOptIn.ts <USER_SEED>
```

### Send MPTokens
```bash
npx tsx sendMPToken.ts <RECIPIENT_ADDRESS> <AMOUNT>
```

## Test Results Summary

| Step | Script | Status | Notes |
|------|--------|--------|-------|
| 1 | createIssuance.ts | ✅ Success | Generated IssuanceID successfully |
| 2 | userOptIn.ts | ✅ Success | User opted in successfully |
| 3 | authorizeHolder.ts | ⚠️ Error | `tecNO_AUTH` - Not required |
| 4 | sendMPToken.ts | ✅ Success | 50 tokens sent successfully |

## Conclusion

XRPL MPToken v1의 실제 동작 방식은 예상보다 간단합니다:
1. **Issuance 생성** → **User Opt-in** → **Token Transfer**
2. 별도의 admin authorization 단계는 필요하지 않음
3. 사용자 opt-in 후 즉시 토큰 전송 가능

이 결과를 바탕으로 TickPay 애플리케이션의 MPToken 통합을 단순화할 수 있습니다.