(this["webpackJsonpself-help-sheets"]=this["webpackJsonpself-help-sheets"]||[]).push([[8],{246:function(e,t,n){"use strict";n.r(t),n.d(t,"default",(function(){return R}));var a=n(2),r=n.n(a),o=n(3),i=n(209),s=n(19),l=n(0),c=n.n(l),u=n(158),m=n(106),d=n(236),f=n(245),p=n(243),v=n(194),E=n(238),h=n(161),b=n(185),g=n(189),x=n(239),w=n(217),j=n.n(w),k=n(24),C=n(33),y=n(81),L=n(32);function P(e,t,n){return S.apply(this,arguments)}function S(){return(S=Object(o.a)(r.a.mark((function e(t,n,a){var o,i,s;return r.a.wrap((function(e){for(;;)switch(e.prev=e.next){case 0:return e.next=2,new Promise((function(e){t.subscribe((function n(a){t.unsubscribe(n),e(a)}))}));case 2:return o=e.sent,i=!1,s=o.map((function(e){var t=e.moodArrays.map((function(e){return A(e,n,a)}));return t.some((function(e){return e.someValuesAreDeleted}))&&(i=!0),e.setMoodsLeft(t[0].newMoods).setMoodsRight(t[1].newMoods)})),e.abrupt("return",{someValuesAreDeleted:i,newEntries:s});case 6:case"end":return e.stop()}}),e)})))).apply(this,arguments)}function A(e,t,n){for(var a=new Map,r=0;r<t.length;r++)a.set(t[r].codePoint,e[r]);for(var o=[],i=0;i<n.length;i++){var s=a.get(n[i].codePoint);o.push(null==s?0:s)}return{newMoods:o,someValuesAreDeleted:t.some((function(e){return a.get(e.codePoint)>0&&null==n.find((function(t){return t.codePoint===e.codePoint}))}))}}var O=n(55),I=n.n(O),D=n(10),U=c.a.memo(j.a),M=Object(u.a)((function(e){return{emojiIcon:{margin:"0px 5px 5px 0px ",fontSize:20,display:"flex",alignItems:"center",paddingLeft:10},hintContainer:{display:"flex",flexDirection:"column"},buttons:{marginTop:20,display:"flex",justifyContent:"space-between"},input:{backgroundColor:e.palette.background.paper}}}));function N(e){var t=M();return c.a.createElement("div",{className:t.hintContainer},c.a.createElement(m.a,{variant:"h6"},e.label+":"),c.a.createElement(d.a,{value:"end",label:"Enable popup",control:c.a.createElement(f.a,{checked:e.value.isEnabled,onChange:function(t){e.onChange(e.value.setIsEnabled(t.target.checked))}})}),c.a.createElement(p.a,{value:e.value.text,onChange:function(t){return e.onChange(e.value.setText(t.target.value))},className:t.input,variant:"outlined",multiline:!0}))}function R(e){var t=M(),n=c.a.useState(k.a.state),a=Object(s.a)(n,2),l=a[0],u=a[1],d=c.a.useState(void 0),f=Object(s.a)(d,2),p=f[0],w=f[1];c.a.useEffect((function(){k.a.addStateListener(u)}),[]),c.a.useEffect((function(){var t=function(e,t){w((function(e){return void 0==e?t:e}))};return void 0!=e.model&&e.model.subscribe(t),function(){void 0!=e.model&&e.model.unsubscribe(t)}}),[e.model]);var j=c.a.useCallback((function(t,n){w((function(t){if(!t)return t;var a=n.emoji.codePointAt(0),r=n.names.length>0?n.names[n.names.length-1]:"";if(-1!==t.emojiList.findIndex((function(e){return e.codePoint===a})))return alert(r+" is already selected"),t;var o,s=Object(i.a)(t.emojiList);s.push({codePoint:a,text:r});var l=t.setEmojiList(s);null===(o=e.model)||void 0===o||o.onSettingsUpdate(l),w(l)}))}),[e.model]);if(l===D.b.SIGNED_OUT)return c.a.createElement(C.a,null,"Sign in to proceed...");if(l===D.b.LOADING||null==p||null==e.model)return c.a.createElement(L.a,null);var S=function(){var t=Object(o.a)(r.a.mark((function t(n){var a,o,s,l,c,u;return r.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(a=Object(i.a)(p.emojiList),-1!==(o=a.findIndex((function(e){return e.codePoint===n})))){t.next=4;break}return t.abrupt("return");case 4:return a.splice(o,1),I()(e.model),t.next=8,P(e.model,p.emojiList,a);case 8:if(s=t.sent,l=s.someValuesAreDeleted,c=s.newEntries,!l||window.confirm("This will delete some moods from some of the entries. Are you sure?")){t.next=13;break}return t.abrupt("return");case 13:c.forEach((function(t){var n;null===(n=e.model)||void 0===n||n.onUpdate(t,!0)})),u=p.setEmojiList(a),e.model.onSettingsUpdate(u),w(u);case 17:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}(),A=function(){var t=Object(o.a)(r.a.mark((function t(){var n,a,o,i,s;return r.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return n=new y.a(""),I()(e.model),t.next=4,P(e.model,p.emojiList,n.emojiList);case 4:a=t.sent,o=a.someValuesAreDeleted,i=a.newEntries,s=o?"This will delete some moods from some entries. Reset settings?":"Reset settings?",window.confirm(s)&&(i.forEach((function(t){var n;null===(n=e.model)||void 0===n||n.onUpdate(t,!0)})),e.model.onSettingsUpdate(n),w(n));case 9:case"end":return t.stop()}}),t)})));return function(){return t.apply(this,arguments)}}();return c.a.createElement(v.a,{container:!0,justify:"center",spacing:2},c.a.createElement(v.a,{item:!0,xs:12},c.a.createElement(m.a,{variant:"h4",align:"center"},"Settings")),c.a.createElement(v.a,{container:!0,item:!0,xs:12,spacing:2},c.a.createElement(v.a,{item:!0,xs:12},c.a.createElement(m.a,{variant:"h5"},"Helper questions")),c.a.createElement(v.a,{item:!0,xs:12,sm:6},c.a.createElement(N,{label:"Left",value:p.leftHint,onChange:function(t){var n,a=p.setLeftHint(t);null===(n=e.model)||void 0===n||n.onSettingsUpdate(a),w(a)}})),c.a.createElement(v.a,{item:!0,xs:12,sm:6},c.a.createElement(N,{label:"Right",value:p.rightHint,onChange:function(t){var n,a=p.setRightHint(t);null===(n=e.model)||void 0===n||n.onSettingsUpdate(a),w(a)}})),c.a.createElement(v.a,{item:!0,xs:12},c.a.createElement(E.a,null))),c.a.createElement(v.a,{container:!0,item:!0,xs:12,spacing:2},c.a.createElement(v.a,{item:!0,xs:12},c.a.createElement(m.a,{variant:"h5"},"Moods")),c.a.createElement(v.a,{container:!0,alignItems:"flex-start",justify:"flex-start",alignContent:"flex-start",item:!0,xs:12,sm:6},c.a.createElement(v.a,{item:!0,xs:12},c.a.createElement(m.a,{variant:"h6"},"Active: ")),p.emojiList.map((function(e){return c.a.createElement(v.a,{item:!0,key:e.codePoint},c.a.createElement(h.a,{className:t.emojiIcon},c.a.createElement(m.a,null,String.fromCodePoint(e.codePoint)),c.a.createElement(b.a,{onClick:function(){return S(e.codePoint)}},c.a.createElement(x.a,null))))}))),c.a.createElement(v.a,{item:!0,xs:12,sm:6},c.a.createElement(m.a,{variant:"h6"},"Add new:"),c.a.createElement(U,{disableSkinTonePicker:!0,disableAutoFocus:!0,onEmojiClick:j})),c.a.createElement(v.a,{item:!0,xs:12,className:t.buttons},c.a.createElement(g.a,{color:"secondary",onClick:A},"Reset defaults"),c.a.createElement(g.a,{color:"primary",onClick:e.onClose},"Close"))))}}}]);
//# sourceMappingURL=8.b0efea70.chunk.js.map