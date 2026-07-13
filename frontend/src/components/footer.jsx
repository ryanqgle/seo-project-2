import '../css/footer.css'

// The small footer bar shown at the bottom of every page. It displays the
// current year (updated automatically) next to the project name.
function Footer() {
  return (
    <footer className="site-footer">
      <p> {new Date().getFullYear()} SEO Project</p>
    </footer>
  )
}

export default Footer
