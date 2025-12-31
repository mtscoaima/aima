#!/usr/bin/env python3
"""CNSPay Non-PG 연동 가이드 문서에서 개발에 필요한 핵심 정보 추출"""

import os

# 시도할 패키지 목록
try:
    import pdfplumber
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("pdfplumber not available, trying PyPDF2...")
    try:
        import PyPDF2
        PYPDF2_AVAILABLE = True
    except ImportError:
        PYPDF2_AVAILABLE = False
        print("PyPDF2 not available either")

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False
    print("pandas not available")

def extract_pdf_text(pdf_path):
    """PDF에서 텍스트 추출"""
    text = ""
    if PDF_AVAILABLE:
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
        except Exception as e:
            print(f"pdfplumber error: {e}")
    elif PYPDF2_AVAILABLE:
        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"
        except Exception as e:
            print(f"PyPDF2 error: {e}")
    return text

def extract_excel_data(excel_path):
    """Excel에서 데이터 추출하여 Markdown 테이블로 변환"""
    if not PANDAS_AVAILABLE:
        return "pandas not available"
    
    try:
        # 모든 시트 읽기
        xls = pd.ExcelFile(excel_path)
        result = ""
        
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)
            result += f"\n## {sheet_name}\n\n"
            result += df.to_markdown(index=False) + "\n\n"
        
        return result
    except Exception as e:
        return f"Error reading Excel: {e}"

def main():
    base_dir = "/Users/user/si/mts/mts-message/CNSPay_Non-PG_연동가이드_v3.1_20250829"
    output_dir = "/Users/user/si/mts/mts-message/docs"
    
    os.makedirs(output_dir, exist_ok=True)
    
    files = {
        "CNSPay_Non-PG_연동가이드_v3.1_20250829.pdf": "CNSPay_Non-PG_연동가이드.md",
        "별첨_CNSPay_Non-PG_암복호화_샘플_v1.2.pdf": "CNSPay_암복호화_샘플.md",
        "별첨_CNSPay_Non-PG_응답코드집_v1.3.xlsx": "CNSPay_응답코드집.md",
        "별첨.Android패키지명 및 iOS앱스키마 리스트_20250407.xlsx": "앱스키마_패키지명_리스트.md",
    }
    
    for src_file, dst_file in files.items():
        src_path = os.path.join(base_dir, src_file)
        dst_path = os.path.join(output_dir, dst_file)
        
        print(f"Processing: {src_file}")
        
        if not os.path.exists(src_path):
            print(f"  File not found: {src_path}")
            continue
        
        if src_file.endswith('.pdf'):
            content = extract_pdf_text(src_path)
            if content:
                with open(dst_path, 'w', encoding='utf-8') as f:
                    f.write(f"# {src_file.replace('.pdf', '')}\n\n")
                    f.write(content)
                print(f"  Saved to: {dst_path}")
            else:
                print(f"  No content extracted")
        
        elif src_file.endswith('.xlsx'):
            content = extract_excel_data(src_path)
            if content:
                with open(dst_path, 'w', encoding='utf-8') as f:
                    f.write(f"# {src_file.replace('.xlsx', '')}\n\n")
                    f.write(content)
                print(f"  Saved to: {dst_path}")
            else:
                print(f"  No content extracted")

if __name__ == "__main__":
    main()





