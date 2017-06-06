// Offset for Site Navigation
$('#siteNav').affix({
  offset: {
    top: 100
  }
})


$(function() {
  $('.container#mnsfade').removeClass('fade-out');
  ConversationPanel.init();
});


$("#enter").click(function() {
  $('#mnsTest').fadeOut(750, 'linear', () => {
    if (user)
      document.location.href = 'chat';
    else
      document.location.href = 'login';
  });
});
