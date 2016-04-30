<script>
    $(document).ready(function() {
        $('a').on('click', function() { // When clicking on an element
            var page = $(this).attr('href'); // Target page
            var speed = 150; // Animation duration (ms)
            $('html, body').animate( { scrollTop: $(page).offset().top - 50 }, speed ); // Go
            return false;
        });
    });
</script>
