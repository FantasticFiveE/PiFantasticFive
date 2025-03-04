import React, { useState } from "react";

function SearchBox({ onSearch }) {
  const [query, setQuery] = useState("");

  const handleSearch = (event) => {
    const value = event.target.value;
    setQuery(value);
    onSearch(value); // Pass search query to parent component
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
        placeholder="Search..."
        value={query}
        onChange={handleSearch}
      />
    </div>
  );
}

export default SearchBox;