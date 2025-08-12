"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import TermsModal, { TermsType } from "@/components/TermsModal";
import { passwordValidation } from "@/lib/utils";
import GeneralSignupForm from "@/components/GeneralSignupForm";
import styles from "./signup.module.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    // 사용자 유형 (영업사원만 사용)
    userType: "general" as "general" | "salesperson" | "",

    // 기본 정보 (영업사원만 사용)
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    birthDate: "",
    phoneVerified: false,
    identityVerified: false,
    ci: "",

    // 기업 정보 (영업사원만 사용)
    companyName: "",
    ceoName: "",
    businessNumber: "",
    companyAddress: "",
    companyAddressDetail: "",
    companyPhone: "",
    toll080Number: "",
    customerServiceNumber: "",

    // 제출 서류 (영업사원만 사용)
    businessRegistration: null as File | null,
    employmentCertificate: null as File | null,

    // 세금계산서 정보 (영업사원만 사용)
    taxInvoiceEmail: "",
    taxInvoiceManager: "",
    taxInvoiceContact: "",

    // 추천인 정보 (영업사원만 사용)
    referrerName: "",
    referrerCode: "",

    // 약관 동의 (영업사원만 사용)
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [verificationTimer, setVerificationTimer] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoginType, setSocialLoginType] = useState<string | null>(null);
  const [socialUserId, setSocialUserId] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null); // 본인인증 ID 추가
  const [showGeneralSignupForm, setShowGeneralSignupForm] = useState(false); // 새로운 일반회원 폼 표시 여부

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTermsType, setCurrentTermsType] =
    useState<TermsType>("service");

  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // 이미 로그인된 사용자는 루트 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  // URL에서 social 파라미터와 socialUserId 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const social = urlParams.get("social");
    const userId = urlParams.get("socialUserId");
    if (social && ["kakao", "naver", "google"].includes(social)) {
      setSocialLoginType(social);
      if (userId) {
        setSocialUserId(userId);
      }
    }
  }, []);

  // URL에서 code 파라미터 확인하고 referral_views 업데이트 및 추천인 정보 자동 채우기
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get("code");

    if (referralCode) {
      // 추천인 정보 자동 채우기
      const fetchReferrerInfo = async () => {
        try {
          const response = await fetch("/api/auth/validate-referral", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referralCode: referralCode,
            }),
          });

          const data = await response.json();

          if (response.ok && data.isValid && data.referrer) {
            // 추천인 정보 자동 채우기
            setFormData((prev) => ({
              ...prev,
              referrerName: data.referrer.name,
              referrerCode: data.referrer.referralCode,
            }));
          }
        } catch (error) {
          console.error("추천인 정보 조회 중 오류:", error);
        }
      };

      // referral_views 업데이트 API 호출
      const updateReferralViews = async () => {
        try {
          const response = await fetch("/api/users/update-referral-views", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              referralCode: referralCode,
            }),
          });

          if (!response.ok) {
            console.error("추천 조회수 업데이트 실패");
          }
        } catch (error) {
          console.error("추천 조회수 업데이트 중 오류:", error);
        }
      };

      // 두 함수를 동시에 실행
      fetchReferrerInfo();
      updateReferralViews();
    }
  }, []);

  // 타이머 관리
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verificationTimer > 0) {
      timer = setTimeout(() => {
        setVerificationTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [verificationTimer]);

  // 본인인증 팝업 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "inicis-auth-success") {
        // 본인인증 성공
        const { userInfo, verificationId: vId } = event.data;
        setFormData((prev) => ({
          ...prev,
          name: userInfo.name,
          phone: userInfo.phoneNumber,
          birthDate: userInfo.birthDate,
          phoneVerified: true,
          identityVerified: true,
        }));
        setVerificationId(vId);
        alert("본인인증이 완료되었습니다.");
      } else if (event.data.type === "inicis-auth-failed") {
        // 본인인증 실패
        alert(`본인인증에 실패했습니다: ${event.data.resultMsg}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // URL에서 본인인증 정보 확인
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const verified = urlParams.get("verified");
    const vId = urlParams.get("verificationId");

    if (verified === "true" && vId) {
      // 서버에서 인증 정보 가져오기
      fetch(`/api/auth/inicis-auth/verify?id=${vId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.userInfo) {
            setFormData((prev) => ({
              ...prev,
              name: data.userInfo.name,
              phone: data.userInfo.phoneNumber,
              birthDate: data.userInfo.birthDate,
              phoneVerified: true,
              identityVerified: true,
            }));
            setVerificationId(vId);
          }
        })
        .catch(console.error);
    }
  }, []);

  // 이메일 실시간 유효성 검사 (디바운스)
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && /\S+@\S+\.\S+/.test(formData.email)) {
        try {
          const response = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: formData.email,
            }),
          });

          if (!response.ok && response.status === 409) {
            setErrors((prev) => ({
              ...prev,
              email: "이미 사용 중인 이메일입니다.",
            }));
          } else if (response.ok) {
            setErrors((prev) => ({ ...prev, email: "" }));
          }
        } catch (error) {
          console.error("이메일 확인 오류:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkEmail, 1000); // 1초 디바운스
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // 아이디 실시간 유효성 검사 (디바운스)
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username) {
        // 아이디 형식 검증 (영문, 숫자, 언더스코어만 허용, 3-20자)
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
          setErrors((prev) => ({
            ...prev,
            username:
              "아이디는 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력하세요.",
          }));
          return;
        }

        try {
          const response = await fetch("/api/auth/check-username", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              username: formData.username,
            }),
          });

          if (!response.ok && response.status === 409) {
            setErrors((prev) => ({
              ...prev,
              username: "이미 사용 중인 아이디입니다.",
            }));
          } else if (response.ok) {
            setErrors((prev) => ({ ...prev, username: "" }));
          }
        } catch (error) {
          console.error("아이디 확인 오류:", error);
        }
      }
    };

    const timeoutId = setTimeout(checkUsername, 1000); // 1초 디바운스
    return () => clearTimeout(timeoutId);
  }, [formData.username]);

  // 로그인된 사용자에게는 로딩 화면 표시
  if (isAuthenticated) {
    return (
      <div className={styles.signupContainer}>
        <div className={styles.signupWrapper}>
          <div className={styles.signupCard}>
            <div className={styles.signupHeader}>
              <div className={styles.logoSection}>
                <h1 className={styles.logoText}>MTS플러스</h1>
                <p className={styles.subtitle}>AI 기반 타깃 마케팅 플랫폼</p>
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>이미 로그인되어 있습니다. 메인 페이지로 이동합니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 실시간 유효성 검사
    if (name === "confirmPassword" && value !== formData.password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
    } else if (name === "confirmPassword" && value === formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }

    // 휴대폰 번호가 변경되면 인증 상태 초기화
    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phoneVerified: false }));
      setVerificationTimer(0);
    }

    // 이메일이나 비밀번호가 변경되면 해당 에러 초기화
    if (
      name === "username" ||
      name === "email" ||
      name === "password" ||
      name === "name" ||
      name === "phone" ||
      name === "userType" ||
      name === "referrerName" ||
      name === "referrerCode"
    ) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // 약관 동의 시 에러 초기화
    if ((name === "agreeTerms" || name === "agreePrivacy") && checked) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleUserTypeSelect = (type: "general" | "salesperson") => {
    if (type === "general") {
      // 새로운 GeneralSignupForm으로 이동
      setShowGeneralSignupForm(true);
    } else {
      // 영업사원 선택 (현재 주석처리된 상태)
      setFormData((prev) => ({
        ...prev,
        userType: type,
      }));
      setErrors((prev) => ({ ...prev, userType: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];

      // 파일 유형 검증
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          [name]:
            "PDF 또는 이미지 파일(JPG, PNG, GIF, WEBP)만 업로드 가능합니다.",
        }));
        // 파일 입력 초기화
        e.target.value = "";
        return;
      }

      // 파일 크기 검증 (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setErrors((prev) => ({
          ...prev,
          [name]: "파일 크기는 10MB 이하여야 합니다.",
        }));
        // 파일 입력 초기화
        e.target.value = "";
        return;
      }

      // 에러 초기화
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));

      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));
    }
  };

  const handleIdentityVerification = async () => {
    setIsVerificationLoading(true);
    setErrors((prev) => ({ ...prev, phone: "" }));

    try {
      // 본인인증 요청 API 호출
      const response = await fetch("/api/auth/inicis-auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 사용자가 이미 입력한 정보가 있으면 전달 (선택사항)
          name: formData.name || undefined,
          phoneNumber: formData.phone || undefined,
          birthDate: formData.birthDate || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("본인인증 요청에 실패했습니다.");
      }

      const data = await response.json();

      // 팝업창 열기
      const width = 400;
      const height = 640;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        "",
        "inicis_identity_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // 팝업 차단 확인
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
        return;
      }

      // 폼 생성 및 제출
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.authUrl;
      form.target = "inicis_identity_auth";

      // 파라미터 추가
      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      // 폼을 body에 추가하고 제출
      document.body.appendChild(form);
      form.submit();

      // 폼 제거
      document.body.removeChild(form);
    } catch (error) {
      console.error("본인인증 요청 오류:", error);
      alert("본인인증 요청 중 오류가 발생했습니다.");
    } finally {
      setIsVerificationLoading(false);
    }
  };

  // 추천인 정보 검증 함수
  const validateReferrer = async (
    referrerName: string,
    referrerCode: string
  ) => {
    try {
      const response = await fetch("/api/auth/validate-referrer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referrerName: referrerName.trim(),
          referrerCode: referrerCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.isValid) {
        return data.message || "추천인 정보가 올바르지 않습니다.";
      }
      return null; // 검증 성공
    } catch (error) {
      console.error("추천인 검증 오류:", error);
      return "추천인 정보 확인 중 오류가 발생했습니다.";
    }
  };

  const validateStep = async (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        // 사용자 유형 선택 검증 - 일반회원이 기본값이므로 검증 불필요
        // if (!formData.userType) {
        //   newErrors.userType = "회원 유형을 선택해주세요.";
        // }
        break;

      case 2:
        // 기본 정보 검증
        // 먼저 본인인증이 완료되었는지 확인
        if (!formData.identityVerified) {
          newErrors.identityVerified = "본인인증을 완료해주세요.";
          break;
        }

        // 본인인증이 완료된 경우에만 아이디, 이메일, 비밀번호 검증
        // 아이디 검증
        if (!formData.username) {
          newErrors.username = "아이디를 입력해주세요.";
        } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
          newErrors.username =
            "아이디는 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력하세요.";
        } else {
          // 아이디 중복 확인
          try {
            const response = await fetch("/api/auth/check-username", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                username: formData.username,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              if (response.status === 409) {
                newErrors.username = "이미 사용 중인 아이디입니다.";
              } else {
                newErrors.username =
                  data.message || "아이디 확인 중 오류가 발생했습니다.";
              }
            }
          } catch (error) {
            console.error("아이디 중복 확인 오류:", error);
            newErrors.username = "아이디 확인 중 오류가 발생했습니다.";
          }
        }

        if (!formData.email) {
          newErrors.email = "이메일을 입력해주세요.";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = "유효한 이메일 주소를 입력해주세요.";
        } else {
          // 이메일 중복 확인
          try {
            const response = await fetch("/api/auth/check-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: formData.email,
              }),
            });

            const data = await response.json();

            if (!response.ok) {
              if (response.status === 409) {
                newErrors.email = "이미 사용 중인 이메일입니다.";
              } else {
                newErrors.email =
                  data.message || "이메일 확인 중 오류가 발생했습니다.";
              }
            }
          } catch (error) {
            console.error("이메일 중복 확인 오류:", error);
            newErrors.email = "이메일 확인 중 오류가 발생했습니다.";
          }
        }

        // 이름, 생년월일, 휴대폰번호는 본인인증으로 자동 입력되므로 검증 불필요

        if (!formData.password) {
          newErrors.password = "비밀번호를 입력해주세요.";
        } else {
          // 새로운 비밀번호 검증 로직 사용
          const validation = passwordValidation.validatePassword(
            formData.password
          );
          if (!validation.isValid) {
            newErrors.password = validation.errors[0]; // 첫 번째 에러 메시지만 표시
          }
        }

        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "비밀번호 확인을 입력해주세요.";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
        }

        break;

      case 3:
        // 영업사원의 경우 추천인 정보, 일반회원의 경우 기업 정보 검증
        if ((formData.userType as string) === "salesperson") {
          // 추천인 정보 검증 (입력된 경우에만)
          if (formData.referrerName || formData.referrerCode) {
            // 둘 다 입력되어야 함
            if (!formData.referrerName.trim()) {
              newErrors.referrerName = "추천인 이름을 입력해주세요.";
            }
            if (!formData.referrerCode.trim()) {
              newErrors.referrerCode = "추천인 코드를 입력해주세요.";
            }

            // 둘 다 입력된 경우 서버에서 검증
            if (formData.referrerName.trim() && formData.referrerCode.trim()) {
              const referrerError = await validateReferrer(
                formData.referrerName,
                formData.referrerCode
              );
              if (referrerError) {
                newErrors.referrerCode = referrerError;
              }
            }
          }
        } else {
          // 기업 정보 검증
          if (!formData.companyName.trim()) {
            newErrors.companyName = "기업명을 입력해주세요.";
          }
          if (!formData.ceoName.trim()) {
            newErrors.ceoName = "대표자명을 입력해주세요.";
          }
          if (!formData.businessNumber.trim()) {
            newErrors.businessNumber = "사업자등록번호를 입력해주세요.";
          }
          if (!formData.companyAddress.trim()) {
            newErrors.companyAddress = "회사 주소를 입력해주세요.";
          }
          if (!formData.companyPhone.trim()) {
            newErrors.companyPhone = "대표번호를 입력해주세요.";
          }
        }
        break;

      case 4:
        // 영업사원의 경우 약관 동의, 일반회원의 경우 제출 서류 검증
        if ((formData.userType as string) === "salesperson") {
          // 약관 동의 검증
          if (!formData.agreeTerms) {
            newErrors.agreeTerms = "서비스 이용약관에 동의해주세요.";
          }
          if (!formData.agreePrivacy) {
            newErrors.agreePrivacy = "개인정보 수집 및 이용에 동의해주세요.";
          }
        } else {
          // 제출 서류 검증 (일반회원만)
          if (!formData.businessRegistration) {
            newErrors.businessRegistration = "사업자등록증을 업로드해주세요.";
          }
        }
        break;

      case 5:
        // 세금계산서 정보 검증 (일반회원만)
        if ((formData.userType as string) === "general") {
          if (!formData.taxInvoiceEmail.trim()) {
            newErrors.taxInvoiceEmail =
              "세금계산서 수신 이메일을 입력해주세요.";
          } else if (!/\S+@\S+\.\S+/.test(formData.taxInvoiceEmail)) {
            newErrors.taxInvoiceEmail = "유효한 이메일 주소를 입력해주세요.";
          }
          if (!formData.taxInvoiceManager.trim()) {
            newErrors.taxInvoiceManager = "담당자명을 입력해주세요.";
          }
          if (!formData.taxInvoiceContact.trim()) {
            newErrors.taxInvoiceContact = "담당자 연락처를 입력해주세요.";
          } else {
            // 연락처 형식 검증
            const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
            if (
              !phoneRegex.test(formData.taxInvoiceContact.replace(/-/g, ""))
            ) {
              newErrors.taxInvoiceContact =
                "올바른 연락처 형식이 아닙니다. (예: 010-1234-5678)";
            }
          }
        }
        break;

      case 6:
        // 일반회원의 추천인 정보 검증 (입력된 경우에만)
        if ((formData.userType as string) === "general") {
          if (formData.referrerName || formData.referrerCode) {
            // 둘 다 입력되어야 함
            if (!formData.referrerName.trim()) {
              newErrors.referrerName = "추천인 이름을 입력해주세요.";
            }
            if (!formData.referrerCode.trim()) {
              newErrors.referrerCode = "추천인 코드를 입력해주세요.";
            }

            // 둘 다 입력된 경우 서버에서 검증
            if (formData.referrerName.trim() && formData.referrerCode.trim()) {
              const referrerError = await validateReferrer(
                formData.referrerName,
                formData.referrerCode
              );
              if (referrerError) {
                newErrors.referrerCode = referrerError;
              }
            }
          }
        }
        break;

      case 7:
        // 약관 동의 검증 (일반회원만)
        if (!formData.agreeTerms) {
          newErrors.agreeTerms = "서비스 이용약관에 동의해주세요.";
        }
        if (!formData.agreePrivacy) {
          newErrors.agreePrivacy = "개인정보 수집 및 이용에 동의해주세요.";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async () => {
    setIsValidating(true);
    try {
      if (await validateStep(currentStep)) {
        // Step 1에서 일반회원을 선택하고 다음 버튼을 누른 경우
        if (currentStep === 1 && formData.userType === "general") {
          setShowGeneralSignupForm(true);
        } else if ((formData.userType as string) === "salesperson") {
          // 영업사원의 경우: 1(회원유형) -> 2(기본정보) -> 3(추천인) -> 4(약관동의)
          setCurrentStep(currentStep + 1);
        } else {
          // 일반회원의 경우: 1(회원유형) -> 2(기본정보) -> 3(기업정보) -> 4(제출서류) -> 5(세금계산서) -> 6(추천인) -> 7(약관동의)
          setCurrentStep(currentStep + 1);
        }
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsValidating(true);
    try {
      if (!(await validateStep(currentStep))) {
        return;
      }

      // FormData 생성하여 파일과 함께 전송
      const formDataToSend = new FormData();

      // 사용자 유형
      formDataToSend.append("userType", formData.userType);

      // 기본 정보
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phoneNumber", formData.phone);
      formDataToSend.append("birthDate", formData.birthDate);

      // 본인인증 정보
      if (verificationId) {
        formDataToSend.append("verificationId", verificationId);
      }
      if (formData.ci) {
        formDataToSend.append("ci", formData.ci);
      }

      // 기업 정보
      if (formData.companyName)
        formDataToSend.append("companyName", formData.companyName);
      if (formData.ceoName) formDataToSend.append("ceoName", formData.ceoName);
      if (formData.businessNumber)
        formDataToSend.append("businessNumber", formData.businessNumber);
      if (formData.companyAddress)
        formDataToSend.append("companyAddress", formData.companyAddress);
      if (formData.companyAddressDetail)
        formDataToSend.append(
          "companyAddressDetail",
          formData.companyAddressDetail
        );
      if (formData.companyPhone)
        formDataToSend.append("companyPhone", formData.companyPhone);
      if (formData.toll080Number)
        formDataToSend.append("toll080Number", formData.toll080Number);
      if (formData.customerServiceNumber)
        formDataToSend.append(
          "customerServiceNumber",
          formData.customerServiceNumber
        );

      // 세금계산서 정보
      if (formData.taxInvoiceEmail)
        formDataToSend.append("taxInvoiceEmail", formData.taxInvoiceEmail);
      if (formData.taxInvoiceManager)
        formDataToSend.append("taxInvoiceManager", formData.taxInvoiceManager);
      if (formData.taxInvoiceContact)
        formDataToSend.append("taxInvoiceContact", formData.taxInvoiceContact);

      // 추천인 정보
      if (formData.referrerName)
        formDataToSend.append("referrerName", formData.referrerName);
      if (formData.referrerCode)
        formDataToSend.append("referrerCode", formData.referrerCode);

      // 마케팅 동의
      formDataToSend.append(
        "agreeMarketing",
        formData.agreeMarketing.toString()
      );

      // 약관 동의
      formDataToSend.append("agreeTerms", formData.agreeTerms.toString());
      formDataToSend.append("agreePrivacy", formData.agreePrivacy.toString());

      // 소셜 로그인 정보 추가
      if (socialLoginType) {
        formDataToSend.append("socialLoginType", socialLoginType);
      }
      if (socialUserId) {
        formDataToSend.append("socialUserId", socialUserId);
      }

      // 파일 추가
      if (formData.businessRegistration) {
        formDataToSend.append(
          "businessRegistration",
          formData.businessRegistration
        );
      }
      if (formData.employmentCertificate) {
        formDataToSend.append(
          "employmentCertificate",
          formData.employmentCertificate
        );
      }

      // 새로운 API 호출
      const response = await fetch("/api/users/signup-with-files", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "회원가입에 실패했습니다.");
      }

      await response.json();

      // 회원가입 성공
      setIsSuccess(true);

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      console.error("회원가입 실패:", err);
      setError(err instanceof Error ? err.message : "회원가입에 실패했습니다.");
    } finally {
      setIsValidating(false);
    }
  };

  // 비밀번호 강도 계산 (새로운 유틸리티 함수 사용)
  const passwordStrength = passwordValidation.getPasswordStrength(
    formData.password
  );

  // 전체 동의 처리 함수
  const handleAgreeAll = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));

    // 에러 초기화
    if (checked) {
      setErrors((prev) => ({
        ...prev,
        agreeTerms: "",
        agreePrivacy: "",
      }));
    }
  };

  // 모달 열기 함수
  const openTermsModal = (type: TermsType) => {
    setCurrentTermsType(type);
    setIsModalOpen(true);
  };

  // 모달 닫기 함수
  const closeTermsModal = () => {
    setIsModalOpen(false);
  };

  // 전체 동의 상태 확인
  const isAllAgreed =
    formData.agreeTerms && formData.agreePrivacy && formData.agreeMarketing;

  // 진행바에 표시할 총 단계 수 (기본정보 -> 추천인 -> 약관동의)
  const getTotalSteps = () => {
    return (formData.userType as string) === "salesperson" ? 3 : 6;
  };

  // 실제 총 단계 수 (회원유형 포함)
  const getActualTotalSteps = () => {
    return (formData.userType as string) === "salesperson" ? 4 : 7;
  };

  // 진행바에 표시할 단계 번호를 실제 currentStep에서 계산
  const getProgressStep = () => {
    if ((formData.userType as string) === "salesperson") {
      // 영업사원: currentStep 2 -> 진행바 1, currentStep 3 -> 진행바 2
      return currentStep - 1;
    } else {
      // 일반회원: currentStep 2 -> 진행바 1, currentStep 3 -> 진행바 2, ...
      return currentStep - 1;
    }
  };

  const getStepLabel = (step: number) => {
    if ((formData.userType as string) === "salesperson") {
      switch (step) {
        case 1:
          return "기본정보";
        case 2:
          return "추천인";
        case 3:
          return "약관동의";
        default:
          return "";
      }
    } else {
      switch (step) {
        case 1:
          return "기본정보";
        case 2:
          return "기업정보";
        case 3:
          return "제출서류";
        case 4:
          return "세금계산서";
        case 5:
          return "추천인";
        case 6:
          return "약관동의";
        default:
          return "";
      }
    }
  };

  // 회원가입 성공 화면
  if (isSuccess) {
    return (
      <div className={styles.signupContainer}>
        <div className={styles.signupWrapper}>
          <div className={styles.signupCard}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✅</div>
              <h2>회원가입이 완료되었습니다!</h2>
              <p>잠시 후 로그인 페이지로 이동합니다.</p>
              <Link href="/login" className={styles.loginButton}>
                지금 로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 새로운 일반회원 폼이 선택된 경우
  if (showGeneralSignupForm) {
    return (
      <GeneralSignupForm 
        onBack={() => setShowGeneralSignupForm(false)}
      />
    );
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupWrapper}>
        <div className={styles.signupCard}>
          {/* 로고 및 제목 */}
          <div className={styles.signupHeader}>
            <div className={styles.logoSection}>
              <h1 className={styles.logoText}>MTS플러스</h1>
              <p className={styles.subtitle}>AI 기반 타깃 마케팅 플랫폼</p>
            </div>
            <h2 className={styles.signupTitle}>회원가입</h2>
            {socialLoginType && (
              <div className={styles.socialNotice}>
                <p>
                  {socialLoginType === "kakao" && "카카오"}
                  {socialLoginType === "naver" && "네이버"}
                  {socialLoginType === "google" && "구글"}
                  로그인으로 회원가입을 진행하고 있습니다.
                </p>
              </div>
            )}
          </div>

          {/* 진행 상태 표시 - 회원 유형 선택 시에는 숨김 */}
          {currentStep > 1 && (
            <div className={styles.progressBar}>
              {Array.from({ length: getTotalSteps() }, (_, index) => {
                const step = index + 1;
                const progressStep = getProgressStep();
                return (
                  <div
                    key={step}
                    className={`${styles.progressStep} ${
                      progressStep >= step ? styles.active : ""
                    }`}
                  >
                    <span className={styles.stepNumber}>{step}</span>
                    <span className={styles.stepLabel}>
                      {getStepLabel(step)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 에러 메시지 */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            {/* Step 1: 회원 유형 선택 */}
            {currentStep === 1 && (
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>회원 유형 선택</h3>
                <p className={styles.sectionDescription}>
                  가입하실 회원 유형을 선택해주세요.
                </p>

                <div className={styles.userTypeSelection}>
                  <div
                    className={`${styles.userTypeCard} ${
                      formData.userType === "general" ? styles.selected : ""
                    } ${errors.userType ? styles.error : ""}`}
                    onClick={() => handleUserTypeSelect("general")}
                  >
                    <div className={styles.userTypeIcon}>👤</div>
                    <h4 className={styles.userTypeTitle}>일반 회원</h4>
                    <p className={styles.userTypeDescription}>
                      기업의 마케팅 담당자 또는
                      <br />
                      직접 마케팅을 진행하는 사업자
                    </p>
                    <ul className={styles.userTypeFeatures}>
                      <li>타깃 마케팅 서비스 이용</li>
                      <li>캠페인 생성 및 관리</li>
                      <li>메시지 발송 기능</li>
                    </ul>
                  </div>

                  {/* 영업사원 선택 버튼 - 임시 주석처리 */}
                  {/*
                  <div
                    className={`${styles.userTypeCard} ${
                      formData.userType === "salesperson" ? styles.selected : ""
                    } ${errors.userType ? styles.error : ""}`}
                    onClick={() => handleUserTypeSelect("salesperson")}
                  >
                    <div className={styles.userTypeIcon}>💼</div>
                    <h4 className={styles.userTypeTitle}>영업사원</h4>
                    <p className={styles.userTypeDescription}>
                      추천 시스템을 통한
                      <br />
                      리워드 영업사원
                    </p>
                    <ul className={styles.userTypeFeatures}>
                      <li>초대 링크 생성 및 관리</li>
                      <li>리워드 수익 창출</li>
                      <li>조직 관리 및 정산 시스템</li>
                      <li>추천인 현황 대시보드</li>
                    </ul>
                  </div>
                  */}
                </div>

                {errors.userType && (
                  <p className={styles.formError}>{errors.userType}</p>
                )}
              </div>
            )}

            {/* Step 2: 기본 정보 */}
            {currentStep === 2 && (
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>기본 정보</h3>

                {/* 본인인증 섹션 */}
                {!formData.identityVerified && (
                  <div className={styles.identityVerificationSection}>
                    <div className={styles.verificationInfo}>
                      <h4>본인인증이 필요합니다</h4>
                      <p>회원가입을 위해 본인인증을 진행해주세요.</p>
                      <p className={styles.subText}>
                        본인인증을 통해 이름, 생년월일, 휴대폰번호가 자동으로
                        입력됩니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleIdentityVerification}
                      className={styles.identityVerifyButton}
                      disabled={isLoading || isVerificationLoading}
                    >
                      {isVerificationLoading ? "처리 중..." : "본인인증 하기"}
                    </button>
                  </div>
                )}

                {/* 본인인증 완료 후 정보 표시 */}
                {formData.identityVerified && (
                  <>
                    <div className={styles.verifiedMessage}>
                      ✅ 본인인증이 완료되었습니다.
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.formLabel}>
                          이름
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          className={styles.formInput}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="birthDate" className={styles.formLabel}>
                          생년월일
                        </label>
                        <input
                          type="text"
                          id="birthDate"
                          name="birthDate"
                          value={formData.birthDate}
                          className={styles.formInput}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="phone" className={styles.formLabel}>
                          휴대폰 번호
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          className={styles.formInput}
                          disabled
                          readOnly
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* 아이디, 이메일과 비밀번호는 본인인증 완료 후에만 입력 가능 */}
                {formData.identityVerified && (
                  <>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label
                          htmlFor="username"
                          className={`${styles.formLabel} ${styles.required}`}
                        >
                          아이디
                        </label>
                        <input
                          type="text"
                          id="username"
                          name="username"
                          value={formData.username}
                          onChange={handleInputChange}
                          className={`${styles.formInput} ${
                            errors.username ? styles.error : ""
                          }`}
                          placeholder="영문, 숫자, 언더스코어 3-20자"
                          required
                          disabled={isLoading}
                        />
                        {errors.username && (
                          <p className={styles.formError}>{errors.username}</p>
                        )}
                        <p className={styles.passwordHint}>
                          영문, 숫자, 언더스코어만 사용 가능 (3-20자)
                        </p>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label
                          htmlFor="email"
                          className={`${styles.formLabel} ${styles.required}`}
                        >
                          이메일 주소
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`${styles.formInput} ${
                            errors.email ? styles.error : ""
                          }`}
                          placeholder="example@email.com"
                          required
                          disabled={isLoading}
                        />
                        {errors.email && (
                          <p className={styles.formError}>{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label
                          htmlFor="password"
                          className={`${styles.formLabel} ${styles.required}`}
                        >
                          비밀번호
                        </label>
                        <input
                          type="password"
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`${styles.formInput} ${
                            errors.password ? styles.error : ""
                          }`}
                          placeholder="8~20자의 영문, 숫자, 특수기호 조합"
                          required
                          disabled={isLoading}
                        />
                        {formData.password && passwordStrength.strength > 0 && (
                          <div className={styles.passwordStrength}>
                            <div className={styles.strengthBar}>
                              <div
                                className={styles.strengthFill}
                                style={{
                                  width: `${
                                    (passwordStrength.strength / 4) * 100
                                  }%`,
                                  backgroundColor: passwordStrength.color,
                                }}
                              />
                            </div>
                            <span
                              className={styles.strengthText}
                              style={{ color: passwordStrength.color }}
                            >
                              {passwordStrength.text}
                            </span>
                          </div>
                        )}
                        {errors.password && (
                          <p className={styles.formError}>{errors.password}</p>
                        )}
                        <div className={styles.passwordHint}>
                          {passwordValidation
                            .getPasswordRules()
                            .map((rule, index) => (
                              <p
                                key={index}
                                style={{
                                  margin: "2px 0",
                                  fontSize: "12px",
                                  color: "#666",
                                }}
                              >
                                • {rule}
                              </p>
                            ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label
                          htmlFor="confirmPassword"
                          className={`${styles.formLabel} ${styles.required}`}
                        >
                          비밀번호 확인
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className={`${styles.formInput} ${
                            errors.confirmPassword ? styles.error : ""
                          }`}
                          placeholder="비밀번호를 다시 입력해주세요"
                          required
                          disabled={isLoading}
                        />
                        {errors.confirmPassword && (
                          <p className={styles.formError}>
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: 추천인 정보 - 영업사원인 경우 */}
            {currentStep === 3 &&
              (formData.userType as string) === "salesperson" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>추천인 정보</h3>
                  <p className={styles.sectionDescription}>
                    추천인이 있으시면 정보를 입력해주세요. (선택사항)
                  </p>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="referrerName"
                        className={styles.formLabel}
                      >
                        추천인 이름
                      </label>
                      <input
                        type="text"
                        id="referrerName"
                        name="referrerName"
                        value={formData.referrerName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.referrerName ? styles.error : ""
                        }`}
                        placeholder="추천인 이름을 입력하세요"
                      />
                      {errors.referrerName && (
                        <p className={styles.formError}>
                          {errors.referrerName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="referrerCode"
                        className={styles.formLabel}
                      >
                        추천인 코드
                      </label>
                      <input
                        type="text"
                        id="referrerCode"
                        name="referrerCode"
                        value={formData.referrerCode}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.referrerCode ? styles.error : ""
                        }`}
                        placeholder="추천인 코드를 입력하세요"
                      />
                      {errors.referrerCode && (
                        <p className={styles.formError}>
                          {errors.referrerCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Step 4: 약관 동의 - 영업사원인 경우 */}
            {currentStep === 4 &&
              (formData.userType as string) === "salesperson" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>약관 동의</h3>

                  <div className={styles.termsGroup}>
                    {/* 전체 동의 */}
                    <label
                      className={`${styles.checkboxLabel} ${styles.agreeAllLabel}`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllAgreed}
                        onChange={(e) => handleAgreeAll(e.target.checked)}
                        className={styles.checkboxInput}
                        disabled={isLoading}
                      />
                      <span
                        className={`${styles.checkboxText} ${styles.agreeAllText}`}
                      >
                        <strong>전체 동의</strong>
                      </span>
                    </label>

                    <div className={styles.termsDivider}></div>

                    <label
                      className={`${styles.checkboxLabel} ${
                        styles.requiredTerm
                      } ${errors.agreeTerms ? styles.error : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        required
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>서비스 이용약관</strong>에 동의합니다 (필수)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("service")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                    {errors.agreeTerms && (
                      <p className={styles.formError}>{errors.agreeTerms}</p>
                    )}

                    <label
                      className={`${styles.checkboxLabel} ${
                        styles.requiredTerm
                      } ${errors.agreePrivacy ? styles.error : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="agreePrivacy"
                        checked={formData.agreePrivacy}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        required
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>개인정보 수집 및 이용</strong>에 동의합니다
                        (필수)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("privacy")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                    {errors.agreePrivacy && (
                      <p className={styles.formError}>{errors.agreePrivacy}</p>
                    )}

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>마케팅 정보 수집 및 활용</strong>에 동의합니다
                        (선택)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("marketing")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                  </div>
                </div>
              )}

            {/* Step 3: 기업 정보 - 일반회원인 경우만 표시 */}
            {currentStep === 3 &&
              (formData.userType as string) === "general" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>기업 정보</h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="companyName"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        기업명
                      </label>
                      <input
                        type="text"
                        id="companyName"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.companyName ? styles.error : ""
                        }`}
                        placeholder="(주)회사명"
                        required
                      />
                      {errors.companyName && (
                        <p className={styles.formError}>{errors.companyName}</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="ceoName"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        대표자명
                      </label>
                      <input
                        type="text"
                        id="ceoName"
                        name="ceoName"
                        value={formData.ceoName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.ceoName ? styles.error : ""
                        }`}
                        placeholder="대표자명"
                        required
                      />
                      {errors.ceoName && (
                        <p className={styles.formError}>{errors.ceoName}</p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="businessNumber"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        사업자등록번호
                      </label>
                      <input
                        type="text"
                        id="businessNumber"
                        name="businessNumber"
                        value={formData.businessNumber}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.businessNumber ? styles.error : ""
                        }`}
                        placeholder="123-45-67890"
                        required
                      />
                      {errors.businessNumber && (
                        <p className={styles.formError}>
                          {errors.businessNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="companyAddress"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        회사 주소
                      </label>
                      <input
                        type="text"
                        id="companyAddress"
                        name="companyAddress"
                        value={formData.companyAddress}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.companyAddress ? styles.error : ""
                        }`}
                        placeholder="주소를 입력하세요"
                        required
                      />
                      {errors.companyAddress && (
                        <p className={styles.formError}>
                          {errors.companyAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="companyAddressDetail"
                        className={styles.formLabel}
                      >
                        상세 주소
                      </label>
                      <input
                        type="text"
                        id="companyAddressDetail"
                        name="companyAddressDetail"
                        value={formData.companyAddressDetail}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="상세 주소를 입력하세요"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="companyPhone"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        대표번호
                      </label>
                      <input
                        type="tel"
                        id="companyPhone"
                        name="companyPhone"
                        value={formData.companyPhone}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.companyPhone ? styles.error : ""
                        }`}
                        placeholder="02-1234-5678"
                        required
                      />
                      {errors.companyPhone && (
                        <p className={styles.formError}>
                          {errors.companyPhone}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="toll080Number"
                        className={styles.formLabel}
                      >
                        080 수신거부 번호
                      </label>
                      <input
                        type="tel"
                        id="toll080Number"
                        name="toll080Number"
                        value={formData.toll080Number}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="080-123-4567"
                      />
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="customerServiceNumber"
                        className={styles.formLabel}
                      >
                        고객센터 번호
                      </label>
                      <input
                        type="tel"
                        id="customerServiceNumber"
                        name="customerServiceNumber"
                        value={formData.customerServiceNumber}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="1588-1234"
                      />
                    </div>
                  </div>
                </div>
              )}

            {/* Step 4: 제출 서류 - 일반회원인 경우만 표시 */}
            {currentStep === 4 &&
              (formData.userType as string) === "general" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>제출 서류</h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="businessRegistration"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        사업자등록증
                      </label>
                      <input
                        type="file"
                        id="businessRegistration"
                        name="businessRegistration"
                        onChange={handleFileChange}
                        className={`${styles.fileInput} ${
                          errors.businessRegistration ? styles.error : ""
                        }`}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
                        required
                      />
                      <p className={styles.fileHelp}>
                        PDF 또는 이미지 파일(JPG, PNG, GIF, WEBP)만 업로드
                        가능합니다. (최대 10MB)
                      </p>
                      {errors.businessRegistration && (
                        <p className={styles.formError}>
                          {errors.businessRegistration}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="employmentCertificate"
                        className={`${styles.formLabel} ${
                          formData.userType === "salesperson"
                            ? styles.required
                            : ""
                        }`}
                      >
                        재직증명서{" "}
                        {formData.userType === "salesperson"
                          ? "(필수)"
                          : "(선택)"}
                      </label>
                      <input
                        type="file"
                        id="employmentCertificate"
                        name="employmentCertificate"
                        onChange={handleFileChange}
                        className={`${styles.fileInput} ${
                          errors.employmentCertificate ? styles.error : ""
                        }`}
                        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/*"
                        required={formData.userType === "salesperson"}
                      />
                      <p className={styles.fileHelp}>
                        {formData.userType === "salesperson"
                          ? "영업사원은 재직증명서를 반드시 업로드해주세요."
                          : "영업사원인 경우 재직증명서를 업로드해주세요."}{" "}
                        PDF 또는 이미지 파일만 가능합니다. (최대 10MB)
                      </p>
                      {errors.employmentCertificate && (
                        <p className={styles.formError}>
                          {errors.employmentCertificate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Step 5: 세금계산서 정보 - 일반회원인 경우만 표시 */}
            {currentStep === 5 &&
              (formData.userType as string) === "general" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>세금계산서 수령 정보</h3>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="taxInvoiceEmail"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        수신 이메일
                      </label>
                      <input
                        type="email"
                        id="taxInvoiceEmail"
                        name="taxInvoiceEmail"
                        value={formData.taxInvoiceEmail}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.taxInvoiceEmail ? styles.error : ""
                        }`}
                        placeholder="tax@company.com"
                        required
                      />
                      {errors.taxInvoiceEmail && (
                        <p className={styles.formError}>
                          {errors.taxInvoiceEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="taxInvoiceManager"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        담당자명
                      </label>
                      <input
                        type="text"
                        id="taxInvoiceManager"
                        name="taxInvoiceManager"
                        value={formData.taxInvoiceManager}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.taxInvoiceManager ? styles.error : ""
                        }`}
                        placeholder="담당자명"
                        required
                      />
                      {errors.taxInvoiceManager && (
                        <p className={styles.formError}>
                          {errors.taxInvoiceManager}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="taxInvoiceContact"
                        className={`${styles.formLabel} ${styles.required}`}
                      >
                        담당자 연락처
                      </label>
                      <input
                        type="tel"
                        id="taxInvoiceContact"
                        name="taxInvoiceContact"
                        value={formData.taxInvoiceContact}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.taxInvoiceContact ? styles.error : ""
                        }`}
                        placeholder="010-1234-5678"
                        required
                      />
                      {errors.taxInvoiceContact && (
                        <p className={styles.formError}>
                          {errors.taxInvoiceContact}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Step 6: 추천인 정보 - 일반회원인 경우 */}
            {currentStep === 6 &&
              (formData.userType as string) === "general" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>추천인 정보</h3>
                  <p className={styles.sectionDescription}>
                    추천인이 있으시면 정보를 입력해주세요. (선택사항)
                  </p>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="referrerName"
                        className={styles.formLabel}
                      >
                        추천인 이름
                      </label>
                      <input
                        type="text"
                        id="referrerName"
                        name="referrerName"
                        value={formData.referrerName}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.referrerName ? styles.error : ""
                        }`}
                        placeholder="추천인 이름을 입력하세요"
                      />
                      {errors.referrerName && (
                        <p className={styles.formError}>
                          {errors.referrerName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label
                        htmlFor="referrerCode"
                        className={styles.formLabel}
                      >
                        추천인 코드
                      </label>
                      <input
                        type="text"
                        id="referrerCode"
                        name="referrerCode"
                        value={formData.referrerCode}
                        onChange={handleInputChange}
                        className={`${styles.formInput} ${
                          errors.referrerCode ? styles.error : ""
                        }`}
                        placeholder="추천인 코드를 입력하세요"
                      />
                      {errors.referrerCode && (
                        <p className={styles.formError}>
                          {errors.referrerCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* Step 7: 약관 동의 - 일반회원인 경우만 표시 */}
            {currentStep === 7 &&
              (formData.userType as string) === "general" && (
                <div className={styles.formSection}>
                  <h3 className={styles.sectionTitle}>약관 동의</h3>

                  <div className={styles.termsGroup}>
                    {/* 전체 동의 */}
                    <label
                      className={`${styles.checkboxLabel} ${styles.agreeAllLabel}`}
                    >
                      <input
                        type="checkbox"
                        checked={isAllAgreed}
                        onChange={(e) => handleAgreeAll(e.target.checked)}
                        className={styles.checkboxInput}
                        disabled={isLoading}
                      />
                      <span
                        className={`${styles.checkboxText} ${styles.agreeAllText}`}
                      >
                        <strong>전체 동의</strong>
                      </span>
                    </label>

                    <div className={styles.termsDivider}></div>

                    <label
                      className={`${styles.checkboxLabel} ${
                        styles.requiredTerm
                      } ${errors.agreeTerms ? styles.error : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="agreeTerms"
                        checked={formData.agreeTerms}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        required
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>서비스 이용약관</strong>에 동의합니다 (필수)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("service")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                    {errors.agreeTerms && (
                      <p className={styles.formError}>{errors.agreeTerms}</p>
                    )}

                    <label
                      className={`${styles.checkboxLabel} ${
                        styles.requiredTerm
                      } ${errors.agreePrivacy ? styles.error : ""}`}
                    >
                      <input
                        type="checkbox"
                        name="agreePrivacy"
                        checked={formData.agreePrivacy}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        required
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>개인정보 수집 및 이용</strong>에 동의합니다
                        (필수)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("privacy")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                    {errors.agreePrivacy && (
                      <p className={styles.formError}>{errors.agreePrivacy}</p>
                    )}

                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="agreeMarketing"
                        checked={formData.agreeMarketing}
                        onChange={(e) => handleInputChange(e)}
                        className={styles.checkboxInput}
                        disabled={isLoading}
                      />
                      <span className={styles.checkboxText}>
                        <strong>마케팅 정보 수집 및 활용</strong>에 동의합니다
                        (선택)
                      </span>
                      <button
                        type="button"
                        onClick={() => openTermsModal("marketing")}
                        className={styles.termsLink}
                      >
                        보기
                      </button>
                    </label>
                  </div>
                </div>
              )}

            {/* 버튼 영역 */}
            <div className={styles.buttonGroup}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={styles.prevButton}
                  disabled={isLoading || isValidating}
                >
                  이전
                </button>
              )}

              {currentStep < getActualTotalSteps() ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.nextButton}
                  disabled={isLoading || isValidating}
                >
                  {isValidating ? "확인 중..." : "다음"}
                </button>
              ) : (
                <button
                  type="submit"
                  className={styles.signupButton}
                  disabled={isLoading || isValidating}
                >
                  {isLoading || isValidating ? "처리 중..." : "회원가입 완료"}
                </button>
              )}
            </div>
          </form>

          {/* 로그인 링크 */}
          <div className={styles.loginLink}>
            <span>이미 계정이 있으신가요?</span>
            <Link href="/login" className={styles.loginButtonLink}>
              로그인
            </Link>
          </div>
        </div>
      </div>

      {/* 약관 모달 */}
      <TermsModal
        isOpen={isModalOpen}
        onClose={closeTermsModal}
        type={currentTermsType}
      />
    </div>
  );
}
