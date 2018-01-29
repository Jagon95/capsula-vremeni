function isMobile() {
    return /Mobi|Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
        .test(navigator.userAgent || navigator.vendor || window.opera);
}
if(!isMobile()) {
    document.addEventListener("DOMContentLoaded", function () {
        document.getElementsByClassName('events__page')[0].classList.remove("d-none");
        document.getElementsByClassName('titanium-capsule-parallax')[0].classList.remove("d-none");
    });
}