function tAddEventListener(e,t,n){e.addEventListener?e.addEventListener(t,n,!1):e.attachEvent&&e.attachEvent('on'+t,n)}function createFrame(e){var t=this;t.iframeId="pay-form-iframe",t.containerId="pay-form-container";var n=document.createElement('div');n.id=t.containerId,n.style.zIndex='9996',n.style.height='100%',n.style.width='100%',n.style.position='fixed',n.style.left='0px',n.style.top='0px';var o=document.createElement('div');o.style.zIndex='9997',o.style.opacity='0.6',o.style.position='fixed',o.style.left='0px',o.style.top='0px',o.style.bottom='0px',o.style.right='0px',o.style.border='0px',o.style.overflow='visible',o.style.backgroundColor='#000000';var i=document.createElement('div');i.id='div_frame',i.style.height=TinkoffWidgetConstants.HEIGHT,i.style.width=TinkoffWidgetConstants.WIDTH,i.style.maxWidth=TinkoffWidgetConstants.MAX_WIDTH,i.style.left=TinkoffWidgetConstants.LEFT,i.style.top=TinkoffWidgetConstants.TOP,i.style.position='absolute',i.style.zIndex='9998',i.style.border='0px';var r=document.createElement('input');r.type='button',r.value='',r.style.top=TinkoffWidgetConstants.CLOSE_BUTTON_TOP,r.style.width=TinkoffWidgetConstants.CLOSE_BUTTON_WIDTH,r.style.height=TinkoffWidgetConstants.CLOSE_BUTTON_HEIGHT,r.style.right=TinkoffWidgetConstants.CLOSE_BUTTON_RIGHT,r.style.background='url("'+TinkoffWidgetConstants.CLOSE_BUTTON_IMAGE+'") no-repeat',r.style.position='absolute',r.style.zIndex='9999',r.style.cursor='pointer',r.style.border='none',r.style.visibility="hidden",tAddEventListener(r,'click',function(){n.parentNode.removeChild(n)});var a=document.createElement('iframe');a.name=t.iframeId,a.id=t.iframeId,a.src=e,a.style.width='100%',a.style.height='100%',a.style.left='-50%',a.style.position='relative',a.style.backgroundColor='white';var s=document.createElement('style');s.innerHTML='@media screen and (max-width: 1010px), only screen and (max-device-width: 1010px), all  and (max-height:800px){#div_frame {width:100% !important;margin:0 !important; top:0 !important; height: 100% !important}}';var l=document.querySelector('body');l.appendChild(s),tAddEventListener(a,'load',function(){r.style.visibility='visible'}),i.appendChild(r),i.appendChild(a),n.appendChild(o),n.appendChild(i),l.appendChild(n)}function doPay(e){if(e.Amount=window.__TinkoffNormalizeMoney(e.Amount),e.prePay){var t=TinkoffUrl.CONTEXT_URL+"html/payForm/prePayForm.html?"+Object.keys(e).map(function(t){return[t,e[t]].map(encodeURIComponent).join('=')}).join('&');e.Frame?createFrame(t):window.location.href=t}else{var n=TinkoffUrl.CONTEXT_URL+"rest/Init";e.OrderId||(e.OrderId=(new Date).getTime());var o=n+(t="?"+Object.keys(e).map(function(t){return[t,e[t]].map(encodeURIComponent).join("=")}).join("&")),i=new XMLHttpRequest;if(i.open("GET",o,!1),i.send(null),response=i.responseText,0==JSON.parse(response).ErrorCode&&JSON.parse(response).Success){var r=JSON.parse(response).PaymentURL;e.Frame?createFrame(r):window.location.href=r}else alert("Извините, произошла ошибка при регистрации заказа. Ошибка: "+JSON.parse(response).ErrorCode+" "+JSON.parse(response).Message+" "+JSON.parse(response).Details)}}function pay(e){var t=e.email?e.email.value:"",n=e.phone?e.phone.value:"",o=e.name?e.name.value:"";doPay({TerminalKey:e.terminalkey.value,Amount:100*e.amount.value.replace(/,/gi,'.'),OrderId:e.order?e.order.value:"",Description:e.description?e.description.value:"",DATA:"Email="+t+"|Phone="+n+"|Name="+o,Frame:'true'==e.frame.value.toLowerCase(),Language:e.language.value.toLowerCase()})}TinkoffUrl={CONTEXT_URL:"https://securepay.tinkoff.ru/"},TinkoffWidgetConstants={HEIGHT:'800px',WIDTH:'1000px',MAX_WIDTH:'1200px',LEFT:'50%',TOP:'10%',CLOSE_BUTTON_IMAGE:TinkoffUrl.CONTEXT_URL+"html/payForm/img/close-button.png",CLOSE_BUTTON_RIGHT:'50%',CLOSE_BUTTON_WIDTH:'48px',CLOSE_BUTTON_HEIGHT:'32px',CLOSE_BUTTON_TOP:'16px'},window.__TinkoffNormalizeMoney||(window.__TinkoffNormalizeMoney=function(e){var t,n=e.toString().replace(/,/gi,'.'),o=n.match(/\./g),i=n.replace(/\./gi,'').match(/\D/);if(null!=o){if(1!=o.length||null!=i)throw'Значение "'+e.toString()+'" - не является числом.';var r=(t=Number(n)/100).toString().split('.');2==r.length?(r[1].length<2&&(r[1]=r[1]+'0'),t=r[0]+r[1]):t=r[0]+'00'}else t=n;return Number(t)});