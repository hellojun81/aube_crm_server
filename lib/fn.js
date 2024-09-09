

import romanize from 'romanize-korean';

const generateFieldName = (displayName) => {
    // 1. 공백을 언더스코어(_)로 대체
    let fieldName = displayName.trim().replace(/\s+/g, '_');
    
    // 2. 한글을 로마자로 변환 (로마자 변환 함수는 직접 구현하거나 라이브러리를 사용해야 합니다)
    fieldName = romanize(fieldName); // `romanize` 함수는 미리 정의된 함수여야 합니다.
    
    // 3. 모든 문자를 소문자로 변환
    fieldName = fieldName.toLowerCase();
    
    // 4. 필드 이름에 사용할 수 없는 문자는 제거 (알파벳, 숫자, 언더스코어만 허용)
    fieldName = fieldName.replace(/[^a-z0-9_]/g, '');

    // 5. 필드 이름이 숫자로 시작하지 않도록 처리
    if (/^\d/.test(fieldName)) {
        fieldName = `f_${fieldName}`;
    }

    return fieldName;
};


export default {
    generateFieldName,
}

