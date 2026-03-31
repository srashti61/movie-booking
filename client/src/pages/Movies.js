import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Container, Button, Badge, Form, 
  Spinner, Alert, Pagination, InputGroup
} from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Redux actions
import { fetchMovies, setFilters, clearFilters } from '../features/movieSlice';

// API
import { movieAPI } from '../services/api';

// Components
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorAlert from '../components/ErrorAlert';

// CSS
import './Movies.css';

const Movies = () => {
  const dispatch = useDispatch();
  const { movies, loading, error, filters, pagination } = useSelector(state => state.movies);
  
  const [localSearch, setLocalSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [genres, setGenres] = useState([]);
  const [languages, setLanguages] = useState([]);

  // Font classes for consistent typography
  const fontClasses = {
    heading: 'font-family-sans-serif',
    body: 'font-family-base',
  };

  // Fetch movies and filters on component mount
// ✅ Fetch movies when filters change
useEffect(() => {
  dispatch(fetchMovies(filters));
}, [dispatch, filters]);

// ✅ Fetch filter dropdown values ONLY ONCE
useEffect(() => {
  fetchFilters();
}, []);

  // Fetch available filters from API
  const fetchFilters = async () => {
    try {
      const response = await movieAPI.getAllMovies({ limit: 100 });
      if (response.movies) {
        const allGenres = new Set();
        const allLanguages = new Set();
        
        response.movies.forEach(movie => {
          movie.genre?.forEach(g => allGenres.add(g));
          if (movie.language) allLanguages.add(movie.language);
        });
        
        setGenres(['all', ...Array.from(allGenres).sort()]);
        setLanguages(['all', ...Array.from(allLanguages).sort()]);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
      setGenres(['all', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Horror', 'Romance']);
      setLanguages(['all', 'English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam']);
    }
  };

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearch(value);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      dispatch(setFilters({ search: value, page: 1 }));
    }, 500);
    
    setSearchTimeout(timeout);
  };

  // Handle genre filter change
  const handleGenreChange = (e) => {
    const value = e.target.value;
    dispatch(setFilters({ 
      genre: value === 'all' ? '' : value,
      page: 1 
    }));
  };

  // Handle language filter change
  const handleLanguageChange = (e) => {
    const value = e.target.value;
    dispatch(setFilters({ 
      language: value === 'all' ? '' : value,
      page: 1 
    }));
  };

  // Handle rating filter change
const handleRatingChange = (e) => {
  const value = e.target.value;
  dispatch(setFilters({ 
    rating: value === '' ? '' : Number(value),
    page: 1 
  }));
};

  // Handle sort change
  const handleSortChange = (e) => {
    const value = e.target.value;
    const [sortBy, sortOrder] = value.split('-');
    dispatch(setFilters({ 
      sortBy, 
      sortOrder,
      page: 1 
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    dispatch(setFilters({ page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const handleClearFilters = () => {
    dispatch(clearFilters());
    setLocalSearch('');
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.genre) count++;
    if (filters.language) count++;
    if (filters.rating) count++;
    return count;
  };

  if (loading && !movies.length) {
    return (
      <div className="loading-overlay">
        <div className="spinner-modern"></div>
        <p className="mt-3 fw-semibold">Loading movies...</p>
      </div>
    );
  }

  if (error && !movies.length) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <div className="empty-state-icon mb-4">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h3 className={`${fontClasses.heading} mb-3`}>Failed to load movies</h3>
          <p className="text-muted mb-4">{error}</p>
          <Button 
            variant="danger" 
            onClick={() => dispatch(fetchMovies(filters))}
            className="book-btn-modern"
          >
            <i className="fas fa-redo me-2"></i>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className={fontClasses.body}>
      {/* Header Section */}
<section
  className="movies-header"
  style={{
    background: `
      linear-gradient(
        135deg,
        rgba(2, 6, 23, 0.92) 0%,
        rgba(15, 23, 42, 0.9) 45%,
        rgba(0, 0, 0, 0.95) 100%
      ),
      url(/a.avif)
    `,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    padding: '90px 0 70px',
    boxShadow: 'inset 0 -160px 260px rgba(0,0,0,0.7)',
    borderBottom: '1px solid rgba(255,255,255,0.08)'
  }}
>
  <Container>
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-4">

      {/* ✅ Left Title */}
      <div>
        <h1
          className={`fw-bold mb-2 ${fontClasses.heading}`}
          style={{
            color: '#f8fafc',
            textShadow: '0 8px 32px rgba(0,0,0,0.75)'
          }}
        >
          🎬 Now Showing
        </h1>

        <p
          className="mb-0"
          style={{
            color: '#cbd5f5',
            fontSize: '1.05rem'
          }}
        >
          Book tickets for the latest blockbusters
        </p>
      </div>

      {/* ✅ Right Controls */}
      <div className="d-flex align-items-center flex-wrap gap-3">

        {getActiveFilterCount() > 0 && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleClearFilters}
              className="px-4 py-2 rounded-pill shadow"
              style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}} 
            >
              Clear Filters ({getActiveFilterCount()})
            </Button>
          </motion.div>
        )}

        <span
          className="fw-semibold"
          style={{
            color: '#f8fafc',
            fontSize: '0.95rem',
            background: 'rgba(0,0,0,0.55)',
            padding: '8px 14px',
            borderRadius: '999px',
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          Showing {movies.length} of {pagination.total} movies
        </span>

      </div>
    </div>
  </Container>
</section>



      {/* Filters Section */}
      <Container className="mb-5 fade-in-up"
      style={{ background:'linear-gradient(135deg, purple 0%, purple 100%)'}}>
        <Card className="filter-card-modern">
          <Card.Body className="p-4"
          style={{ background:'linear-gradient(135deg, #d8b4fe 0%, #d8b4fe 100%)'}}>
            <Row className="g-4">
              {/* Search */}
              <Col xl={4} lg={6} md={12}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">🔍 Search Movies</Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="form-control-modern border-end-0">
                      <i className="fas fa-search text-muted"></i>
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search by title or description..."
                      value={localSearch}
                      onChange={handleSearchChange}
                      className="form-control-modern border-start-0 ps-1"
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              {/* Genre Filter */}
              <Col xl={2} lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">🎭 Genre</Form.Label>
                  <Form.Select
                    value={filters.genre || 'all'}
                    onChange={handleGenreChange}
                    className="form-select-modern"
                  >
                    <option value="all">All Genres</option>
                    {genres.filter(g => g !== 'all').map(genre => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Language Filter */}
              <Col xl={2} lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">🌐 Language</Form.Label>
                  <Form.Select
                    value={filters.language || 'all'}
                    onChange={handleLanguageChange}
                    className="form-select-modern"
                  >
                    <option value="all">All Languages</option>
                    {languages.filter(l => l !== 'all').map(language => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Rating Filter */}
              <Col xl={2} lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">⭐ Min Rating</Form.Label>
                  <Form.Select
                    value={filters.rating || ''}
                    onChange={handleRatingChange}
                    className="form-select-modern"
                  >
                    <option value="">All Ratings</option>
                    <option value="9">9+ (Excellent)</option>
                    <option value="8">8+ (Very Good)</option>
                    <option value="7">7+ (Good)</option>
                    <option value="6">6+ (Average)</option>
                    <option value="5">5+ (Below Average)</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {/* Sort */}
              <Col xl={2} lg={3} md={6} sm={6}>
                <Form.Group>
                  <Form.Label className="fw-semibold mb-2">📊 Sort By</Form.Label>
                  <Form.Select
value={`${filters.sortBy}-${filters.sortOrder}`}

                    onChange={handleSortChange}
                    className="form-select-modern"
                  >
                    <option value="releaseDate-desc">Newest First</option>
                    <option value="releaseDate-asc">Oldest First</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="rating-asc">Lowest Rated</option>
                    <option value="title-asc">Title A-Z</option>
                    <option value="title-desc">Title Z-A</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>

      {/* Loading indicator for subsequent loads */}
      {loading && movies.length > 0 && (
        <Container className="text-center mb-4">
          <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" variant="danger" size="sm" />
            <span className="ms-3 text-muted fw-medium">Loading more movies...</span>
          </div>
        </Container>
      )}

      {/* Movies Grid */}
      <Container className="pb-5">
        {movies.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Alert variant="light" className="empty-state-card text-center border-0">
              <div className="empty-state-icon mb-4">
                <i className="fas fa-film"></i>
              </div>
              <h3 className={`${fontClasses.heading} mb-3`}>No movies found</h3>
              <p className="text-muted mb-4">
                Try adjusting your filters or search term
              </p>
              <Button 
                variant="danger" 
                onClick={handleClearFilters}
                className="book-btn-modern"
              >
                <i className="fas fa-filter me-2"></i>
                Clear All Filters
              </Button>
            </Alert>
          </motion.div>
        ) : (
          <>
            <Row className="g-4">
              {movies.map((movie, index) => (
                <Col 
                  key={movie._id || movie.id} 
                  xl={3} lg={4} md={6} 
                  className="mb-4 fade-in-up"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -12 }}
                    className="h-100"
                  >
                <Card className="movie-card-modern h-100 d-flex flex-column border-0">

                      
                      {/* Featured Badge */}
                      {movie.isFeatured && (
                        <div className="position-absolute top-0 end-0 m-3 z-2">
                          <Badge className="px-3 py-2 fw-semibold" 
                            style={{
                              background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)',
                              color: '#000',
                              boxShadow: '0 5px 15px rgba(255, 152, 0, 0.3)'
                            }}>
                            <i className="fas fa-star me-1"></i>
                            Featured
                          </Badge>
                        </div>
                      )}
                      
                      {/* Image Container */}
                      <div className="movie-img-container position-relative">
                        <Card.Img 
                          variant="top" 
                          src={movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                          alt={movie.title}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/300x450?text=No+Poster';
                          }}
                        />
                        
                        {/* Rating Badge */}
                        <div className="rating-badge-modern"
                        style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'}}>
                          ⭐ {movie.rating?.toFixed(1) || 'N/A'}
                        </div>
                        
                        {/* Duration Overlay */}
                        <div className="position-absolute bottom-0 start-0 m-3">
                          <Badge className="px-3 py-2 fw-semibold" 
                            style={{
                              background: 'rgba(0, 0, 0, 0.8)',
                              backdropFilter: 'blur(10px)'
                            }}>
                            <i className="fas fa-clock me-1"></i>
                            {formatDuration(movie.duration)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Card Body */}
                      <Card.Body className="d-flex flex-column p-4">
                        
                        {/* Title */}
                        <h5 className={`fw-bold mb-3 text-truncate ${fontClasses.heading}`}>
                          {movie.title}
                        </h5>
                        
                        {/* Genres */}
                        <div className="mb-3">
                          {(movie.genre || []).slice(0, 3).map((genre, index) => (
                            <Badge 
                              key={index} 
                              className="genre-badge-modern me-1 mb-1"
                            >
                              {genre}
                            </Badge>
                          ))}
                          {movie.genre?.length > 3 && (
                            <Badge className="genre-badge-modern mb-1">
                              +{movie.genre.length - 3}
                            </Badge>
                          )}
                          
                          {/* Language */}
                          {movie.language && (
                            <Badge className="genre-badge-modern ms-1 mb-1" 
                              style={{
                                background: 'linear-gradient(135deg, #0dcaf0 0%, #0d6efd 100%)',
                                color: 'white',
                                border: 'none'
                              }}>
                              {movie.language}
                            </Badge>
                          )}
                        </div>
                        
                        {/* Description */}
                        <Card.Text className="text-muted mb-4 flex-grow-1">
                          {movie.description?.length > 100 
                            ? `${movie.description.substring(0, 100)}...` 
                            : movie.description}
                        </Card.Text>
                        
                        {/* Release Date */}
                        {movie.releaseDate && (
                          <div className="mb-3">
                            <small className="text-muted">
                              <i className="fas fa-calendar-alt me-2"></i>
                              Released: {new Date(movie.releaseDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </small>
                          </div>
                        )}
                        
                        {/* Action Button */}
                        <div className="mt-auto">
                          <Link to={`/movies/${movie._id || movie.id}`}>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button 
                                variant="danger" 
                                className="w-100 book-btn-modern"
                                style={{ background:'linear-gradient(135deg, #d8b4fe 0%, purple 100%)'
                                }}
                              >
                                <i className="fas fa-ticket-alt me-2"></i>
                                Book Tickets
                              </Button>
                            </motion.div>
                          </Link>
                        </div>
                        
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="d-flex justify-content-center mt-5 pt-3">
                <div className="text-center">
                  <Pagination className="pagination-modern mb-3">
                    <Pagination.First 
                      onClick={() => handlePageChange(1)} 
                      disabled={pagination.page === 1}
                      className="page-item"
                    />
                    <Pagination.Prev 
                      onClick={() => handlePageChange(pagination.page - 1)} 
                      disabled={pagination.page === 1}
                      className="page-item"
                    />
                    
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === pagination.page}
                          onClick={() => handlePageChange(pageNum)}
                          className="page-item"
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}
                    
                    <Pagination.Next 
                      onClick={() => handlePageChange(pagination.page + 1)} 
                      disabled={pagination.page === pagination.totalPages}
                      className="page-item"
                    />
                    <Pagination.Last 
                      onClick={() => handlePageChange(pagination.totalPages)} 
                      disabled={pagination.page === pagination.totalPages}
                      className="page-item"
                    />
                  </Pagination>
                  
                  <div className="text-muted fw-medium">
                    Page {pagination.page} of {pagination.totalPages} • 
                    <span className="ms-2">
                      {pagination.total} movies total
                    </span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Error for subsequent loads */}
        {error && movies.length > 0 && (
          <Alert variant="warning" className="mt-4 border-0 shadow-sm" 
            style={{
              background: 'linear-gradient(135deg, #fff3cd 0%, #ffecb5 100%)',
              borderRadius: '15px',
              border: '1px solid #ffc107'
            }}>
            <div className="d-flex align-items-center">
              <i className="fas fa-exclamation-triangle text-warning me-3 fs-4"></i>
              <div className="flex-grow-1">
                <strong className="d-block mb-1">Error Loading Movies</strong>
                <span className="text-muted">{error}</span>
              </div>
              <Button 
                variant="outline-warning" 
                size="sm"
                className="ms-3"
                onClick={() => dispatch(fetchMovies(filters))}
              >
                <i className="fas fa-redo me-1"></i>
                Retry
              </Button>
            </div>
          </Alert>
        )}
      </Container>
    </div>
  );
};

export default Movies;