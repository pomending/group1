import React from "react";
import "./PageHeader.css";

function PageHeader({ eyebrow, title, description, actions }) {
    return (
        <header className="erp-page-header">
            <div className="erp-page-header-content">
                {eyebrow && <span className="erp-page-eyebrow">{eyebrow}</span>}
                <h1 className="erp-page-title">{title}</h1>
                {description && <p className="erp-page-description">{description}</p>}
            </div>
            {actions && <div className="erp-page-header-actions">{actions}</div>}
        </header>
    );
}

export default PageHeader;
