import React, { useState } from "react";

function SearchBox({ onSearch = () => {} }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Handle input change
  const handleChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term); // Pass the search term to the parent component
  };

  return (
    <div className="input-group position-relative">
      <span
        className="position-absolute d-flex flex-column justify-content-center align-items-center"
        style={{
          top: 0,
          right: "5%",
          height: "100%",
          zIndex: 5,
        }}
      >
        <i className="bi bi-search m-0 p-0"></i>
      </span>
      <input
        type="text"
        className="form-control pe-3"
        aria-label="SearchBox"
        aria-describedby="SearchBox"
        placeholder="Search"
        value={searchTerm}
        onChange={handleChange} // Call handleChange when input changes
      />
    </div>
  );
}

export default SearchBox;