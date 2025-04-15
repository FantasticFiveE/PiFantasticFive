import React from "react";
import { Heading } from "../../UI/Typography";
import Button from "../../UI/Button";
import SearchBox from "../../UI/SearchBox";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation

function SectionHeader({ title = "", onSearch = () => {}, viewAllPath = "" }) {
  const navigate = useNavigate(); // Initialize useNavigate

  // Handle "View All" button click
  const handleViewAll = () => {
    if (viewAllPath) {
      navigate(viewAllPath); // Navigate to the specified path
    }
  };

  // Handle search input change
  const handleSearch = (term) => {
    onSearch(term); // Pass the search term to the parent component
  };

  return (
    <div className="d-flex justify-content-between align-items-center mb-4 section-header">
      <div className="d-flex justify-content-center align-items-center gap-2">
        <Heading className="title">{title}</Heading>
        <Button variant={"link"} onClick={handleViewAll}>
          View All
        </Button>
      </div>
      <div className="d-flex justify-content-center align-items-center gap-2">
        {/* Pass handleSearch to SearchBox */}
        <SearchBox onSearch={handleSearch} />
        <Button
          variant={"secondary"}
          className="d-flex justify-content-around align-items-center gap-2"
        >
          <i className="bi bi-filter text-primary fs-4"></i>
          <span>Filters</span>
        </Button>
      </div>
    </div>
  );
}

export default SectionHeader;