
import React from 'react';

const SoftFooter = () => {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-interview-text-primary mb-4">
          Need help with your resume or LinkedIn too?
        </h2>
        <p className="text-interview-text-secondary text-lg">
          Check out{' '}
          <a 
            href="https://www.linkedup.tryhireme.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-interview-primary hover:text-interview-dark font-semibold transition-colors"
          >
            LinkedUp
          </a>
          {' '}and{' '}
          <a 
            href="https://www.resubuild.tryhireme.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-interview-primary hover:text-interview-dark font-semibold transition-colors"
          >
            ResuBuild
          </a>
          {' '}— designed by the same team.
        </p>
      </div>
    </section>
  );
};

export default SoftFooter;
