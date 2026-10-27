// 업무용 일정에서 고객관리의 거래처 정보를 선택해 일정에 저장합니다.
import React, { useState } from "react";
import getCustomers from "../1_crm/CustomerService";
import { normalizeConnections } from "./scheduleConnectionsData";

export function getEmployeeSuggestions() {
  try {
    return [...new Set(getCustomers().map(customer => customer?.employeeName?.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

function readCustomerOptions() {
  try {
    const seen = new Set();
    const options = getCustomers()
      .filter(customer => customer && typeof customer.companyName === "string")
      .map(customer => {
        const businessNumber = String(customer.businessNumber || "").replace(/[^0-9a-zA-Z]/g, "");
        const key = businessNumber
          ? "crm:business:" + businessNumber
          : customer.id != null
            ? "crm:id:" + customer.id
            : "crm:name:" + customer.companyName.trim();
        return {
          key,
          id: customer.id == null ? "" : String(customer.id),
          name: customer.companyName.trim(),
          contact: customer.customerManager || "",
          phone: customer.phone || "",
          email: customer.email || "",
          address: customer.address || "",
          summary: customer.memo || "",
        };
      })
      .filter(customer => {
        if (seen.has(customer.key)) return false;
        seen.add(customer.key);
        return true;
      });
    return { options, error: "" };
  } catch {
    return { options: [], error: "고객정보를 읽지 못했습니다. 저장된 고객 자료를 확인해 주세요." };
  }
}

export function ScheduleConnectionSummary({ value }) {
  const customer = normalizeConnections(value).customer;
  if (!customer) return null;
  return (
    <div className="sm-connection-summary">
      <strong>고객사 · {customer.name}</strong>
      {customer.contact && <p>담당자 · {customer.contact}</p>}
      {customer.phone && <p>연락처 · {customer.phone}</p>}
      {customer.email && <p>이메일 · {customer.email}</p>}
      {customer.address && <p>주소 · {customer.address}</p>}
      {customer.summary && <p>고객 메모 · {customer.summary}</p>}
    </div>
  );
}

export default function ScheduleConnections({ value, onChange }) {
  const [customerData, setCustomerData] = useState(readCustomerOptions);
  const [refreshMessage, setRefreshMessage] = useState("");
  const { options, error } = customerData;
  const customer = normalizeConnections(value).customer;
  const availableOptions = customer && !options.some(option => option.key === customer.key)
    ? [customer, ...options]
    : options;
  function selectCustomer(key) {
    const selected = availableOptions.find(option => option.key === key);
    onChange({ target: { name: "connections", value: selected ? { customer: selected } : {} } });
    setRefreshMessage("");
  }
  function refreshCustomer() {
    if (!customer) return;
    const latestData = readCustomerOptions();
    setCustomerData(latestData);
    const latest = latestData.options.find(option => option.key === customer.key);
    if (latest) {
      onChange({ target: { name: "connections", value: { customer: latest } } });
      setRefreshMessage("선택한 고객의 최신 정보를 반영했습니다. 일정 저장을 눌러 확정하세요.");
    } else {
      setRefreshMessage("고객 목록에서 찾지 못했습니다. 거래처를 다시 선택해 주세요.");
    }
  }
  return (
    <details className="sm-customer-connection sm-form-wide">
      <summary>고객관리 연결 (선택)</summary>
      <label>고객사
        <select value={customer?.key || ""} onChange={event => selectCustomer(event.target.value)}>
          <option value="">연결 안 함</option>
          {availableOptions.map(option => <option key={option.key} value={option.key}>{option.name}</option>)}
        </select>
      </label>
      <p className="sm-form-note">고객관리에서 등록한 거래처와 담당자·연락처·주소·메모를 가져옵니다. 연결 정보는 선택한 시점의 사본입니다.</p>
      {error && <p className="sm-form-error" role="alert">{error}</p>}
      {customer && <button type="button" className="sm-customer-refresh" onClick={refreshCustomer}>고객 목록 새로고침</button>}
      {refreshMessage && <p className="sm-form-note" role="status">{refreshMessage}</p>}
      <ScheduleConnectionSummary value={value} />
    </details>
  );
}
