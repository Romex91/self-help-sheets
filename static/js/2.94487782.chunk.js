(this["webpackJsonpself-help-sheets"]=this["webpackJsonpself-help-sheets"]||[]).push([[2],{244:function(e,t,n){"use strict";n.r(t);var a=n(209),r=n(12),o=n(9),l=n(59),i=n(58),s=n(224),c=n(16),u=n(0),d=n.n(u),m=n(21),p=n(19),f=n(158),h=n(190),v=n(106),g=n(247),b=n(185),y=n(202),E=n(241),C=n(221),x=n.n(C),w=n(219),k=n.n(w),R=n(218),O=n.n(R),j=n(67),z=n(240),D=Object(f.a)((function(e){return{outer:{position:"relative"},popup:{position:"absolute",display:"flex",flexDirection:"column",justifyContent:"center",minWidth:140,zIndex:2,padding:10,background:e.palette.background.paper,border:"gray solid 2px",borderRadius:4}}})),A=d.a.forwardRef((function(e,t){var n=D();return e.in?d.a.createElement("div",{ref:t,className:n.outer},d.a.createElement(z.a,{in:e.in},d.a.createElement("div",{className:n.popup},e.children))):null})),M=Object(f.a)((function(e){return{container:{alignSelf:"flex-start",margin:2,cursor:"pointer",borderColor:function(e){return e?"gray":"#0000"},border:"solid 2px",borderRadius:4,position:"relative",backgroundColor:e.palette.background.paper},setupItem:{border:"2px solid",borderColor:function(e){return e?"darkgray":"#0000"},borderRadius:4,fontSize:20,display:"flex",alignItems:"center",justifyContent:"center"},icon:{cursor:"pointer",width:15,margin:0,padding:"4px 1px",height:"30px",border:"1px solid #0000",borderColor:function(e){return e?"gray":"#0000"}},emoji:{userSelect:"none",fontWeight:function(e){return 3===e?"bold":"unset"},opacity:function(e){return 3===e?1:2===e?.7:.3}}}}));function _(e){var t=M(e.value);return d.a.createElement("span",{onClick:e.onClick,className:t.emoji,role:"img","aria-label":e.text},String.fromCodePoint(e.codePoint))}function S(e){var t=M(e.selectedValue===e.value),n=5*(3-e.value)+1;return d.a.createElement(j.a,{className:t.icon,viewBox:"1 1 7 15",onClick:e.onClick},d.a.createElement("rect",{y:n,width:"9",height:16-n,fill:e.value<=e.selectedValue?"red":"lightGray"}))}function T(e){var t=M(e.isActive);return d.a.createElement("div",{className:t.setupItem},d.a.createElement(_,{value:3,codePoint:e.codePoint,text:e.text,onClick:function(){return e.onChange((e.value+1)%4)}}),d.a.createElement(S,{onClick:function(){return e.onChange(0)},selectedValue:e.value,value:0}),d.a.createElement(S,{onClick:function(){return e.onChange(1)},selectedValue:e.value,value:1}),d.a.createElement(S,{onClick:function(){return e.onChange(2)},selectedValue:e.value,value:2}),d.a.createElement(S,{onClick:function(){return e.onChange(3)},selectedValue:e.value,value:3}))}function F(e){var t=d.a.useState(!1),n=Object(p.a)(t,2),r=n[0],o=n[1],l=d.a.useState(-1),i=Object(p.a)(l,2),s=i[0],c=i[1],u=d.a.useRef(null),f=M(r);if(0===e.moodsArray.length)return null;var h=e.moodsArray.filter((function(e){return e.value>0})),g=0;return d.a.createElement(d.a.Fragment,null,d.a.createElement("div",{tabIndex:0,onClick:function(e){e.stopPropagation()},onFocus:function(){e.onFocus(),o(!0)},onBlur:function(){u.current&&!u.current.contains(document.activeElement)&&(o(!1),e.onBlur())},className:f.container,onKeyDown:function(t){if("ArrowLeft"===t.key){if(s<0&&c(s=0),s<e.moodsArray.length){var n=Object(a.a)(e.moodsArray);n[s].value--,n[s].value<0&&(n[s].value=3),e.onMoodArrayChange(n)}}else if("ArrowRight"===t.key){if(s<0&&c(s=0),s<e.moodsArray.length){var r=Object(a.a)(e.moodsArray);r[s].value++,r[s].value>3&&(r[s].value=0),e.onMoodArrayChange(r)}}else if("ArrowDown"===t.key)++s>=e.moodsArray.length&&(s=0),c(s);else if("ArrowUp"===t.key)--s<0&&(s=e.moodsArray.length-1),c(s);else{if("Escape"!==t.key&&"Enter"!==t.key)return;var o;null===(o=e.inputRef.current)||void 0===o||o.focus()}t.preventDefault()}},h.length>0?h.map((function(e){return d.a.createElement(_,{key:e.codePoint,codePoint:e.codePoint,text:e.text,value:e.value})})):d.a.createElement(v.a,{variant:"caption",color:"textSecondary"},"add mood"),d.a.createElement(A,{in:r,ref:u},d.a.createElement(v.a,{align:"center",variant:"body1"},e.text),d.a.createElement(d.a.Fragment,null,e.moodsArray.map((function(t){return d.a.createElement(T,{key:t.codePoint,isActive:g++===s,codePoint:t.codePoint,text:t.text,value:t.value,onChange:function(n){e.onMoodArrayChange(e.moodsArray.map((function(e){return e.codePoint===t.codePoint?Object(m.a)(Object(m.a)({},e),{},{value:n}):e})))}})}))),d.a.createElement(v.a,{align:"center",variant:"caption"},"Use arrow keys."))," "))}var P=n(43),I=function(e){return{border:"solid",borderRadius:4,backgroundColor:e.palette.background.paper,padding:function(e){return e.focused?4:5},borderWidth:function(e){return!0===e.focused?2:1},borderColor:function(t){return!0===t.focused?e.palette.primary.light:"gray"}}},H=Object(f.a)((function(e){return{inner:Object(c.a)({display:"flex",flex:1,flexDirection:"column",position:"relative"},e.breakpoints.up("sm"),I(e)),input:{padding:"0px 7px",marginTop:function(e){return e.hasCreationTime?0:19},minHeight:function(e){return e.hasMoods?76:104},alignItems:"flex-start"},outer:Object(c.a)({display:"flex",alignItems:"flex-start",flexDirection:"row"},e.breakpoints.down("xs"),I(e)),date:{border:"0px !important",marginBottom:"0px !important",paddingBottom:"0px !important"},hint:{display:"flex",alignItems:"center",gap:"10px",backgroundColor:e.palette.background.paper,whiteSpace:"pre-line"}}}));function U(e){var t,n=d.a.useState(!1),a=Object(p.a)(n,2),r=a[0],o=a[1],l=d.a.useState(!1),i=Object(p.a)(l,2),s=i[0],c=i[1];d.a.useEffect((function(){r&&e.onFocus(!0)}),[r,e.onFocus]);var u=H({hasCreationTime:void 0!=e.creationTime,hasMoods:e.moodsArray.length>0,focused:r||s}),m=d.a.useRef(null);return d.a.useEffect((function(){var t;!e.collapsed&&e.autoFocus&&(null===(t=m.current)||void 0===t||t.focus())}),[e.collapsed,e.autoFocus]),d.a.createElement(h.a,{in:!e.collapsed,onExited:e.onCollapseExited,onEntered:function(){var t;e.autoFocus&&(null===(t=m.current)||void 0===t||t.focus())}},d.a.createElement("div",{className:u.outer},d.a.createElement("div",{className:u.inner,onClick:function(){var e,t;0===(null===(e=window.getSelection())||void 0===e?void 0:e.toString().length)&&(null===(t=m.current)||void 0===t||t.focus())}},e.creationTime&&d.a.createElement(v.a,{variant:"caption",color:"textSecondary",align:"center"},O()(e.creationTime).format("h:mm a")),d.a.createElement(g.a,{className:u.input,fullWidth:!0,multiline:!0,placeholder:void 0!=e.hint?e.hint.text:"",inputRef:m,onFocus:function(){o(!0),e.onFocus(!1)},onBlur:function(){o(!1)},value:e.value,onChange:e.onChange}),d.a.createElement(F,{text:e.moodsText,onMoodArrayChange:e.onMoodsArrayChange,moodsArray:e.moodsArray,inputRef:m,onFocus:function(){e.onFocus(!1),c(!0)},onBlur:function(){c(!1)}}),null!=e.hint&&e.hint.isEnabled&&e.value.length>0&&d.a.createElement(A,{in:r},d.a.createElement(v.a,{className:u.hint,color:"textSecondary"},null===(t=e.hint)||void 0===t?void 0:t.text,d.a.createElement(b.a,{size:"small",onMouseDown:function(){window.location.hash="settings"}},d.a.createElement(k.a,null))))),d.a.createElement(y.a,{xsDown:!e.deleteXsDown,smUp:!e.deleteSmUp},d.a.createElement(b.a,{disabled:e.example,"aria-label":"delete",size:"small",onClick:e.onDelete},d.a.createElement(x.a,{color:e.example?"disabled":"action",fontSize:"small"})))))}var N=function e(t){Object(r.a)(this,e),this.key=void 0,this.text=void 0,this.focused=!1,this.key=this.text=O()(t).calendar({sameDay:"[Today], MMM Do, ddd",lastDay:"[Yesterday] , MMM Do, ddd",lastWeek:"MMM Do YYYY, ddd",sameElse:"MMM Do YYYY, ddd"})},B=d.a.forwardRef((function(e,t){var n,a,r=H({focused:!1,hasCreationTime:!1,hasMoods:!1}),o=!(e.entry instanceof P.a)||e.entry.initiallyCollapsed,l=d.a.useState(o),i=Object(p.a)(l,2),s=i[0],c=i[1];if(d.a.useEffect((function(){o&&c(!1)}),[o]),!(e.entry instanceof P.a))return d.a.createElement("tr",{ref:t,className:r.date},d.a.createElement("td",{colSpan:2},d.a.createElement(h.a,{in:!s},d.a.createElement(v.a,{variant:"body2",align:"center",color:"textSecondary"},e.entry.text))));var u=e.entry;d.a.useEffect((function(){u.initiallyCollapsed&&e.onUpdate(u.setInitiallyCollapsed(!1),!0)}),[u,e.onUpdate]),d.a.useEffect((function(){u.data===P.b.HIDDEN&&e.onUpdate(u.show(),!0)}));var f=[],g=[];if(null!=e.settings)for(var b=0;b<e.settings.emojiList.length;b++)f.push(Object(m.a)({value:null==u.moodArrays[0][b]?0:u.moodArrays[0][b]},e.settings.emojiList[b])),g.push(Object(m.a)({value:null==u.moodArrays[1][b]?0:u.moodArrays[1][b]},e.settings.emojiList[b]));var y=function(t){e.onUpdate(t,!1)},C=function(t){u.focused&&e.onUpdate(u.setFocused(!1),!0),!t&&e.onFocus&&e.onFocus()};return d.a.createElement("tr",{ref:t},d.a.createElement("td",{key:"issueElement"},u.isDataLoaded()?d.a.createElement(U,{autoFocus:u.focused&&u.lastChange!==P.c.EDIT_RIGHT,creationTime:u.creationTime,value:u.left,onChange:function(e){return y(u.setLeft(e.target.value))},onFocus:C,onDelete:function(){c(!0)},deleteXsDown:!0,example:e.example,collapsed:s,hint:null===(n=e.settings)||void 0===n?void 0:n.leftHint,moodsText:"How do you feel now?",moodsArray:f,onMoodsArrayChange:function(e){return y(u.setMoodsLeft(e.map((function(e){return e.value}))))}}):d.a.createElement(E.a,{variant:"rect",height:135})),d.a.createElement("td",{key:"resolutionElement"},u.isDataLoaded()?d.a.createElement(U,{autoFocus:u.focused&&u.lastChange===P.c.EDIT_RIGHT,value:u.right,onChange:function(e){return y(u.setRight(e.target.value))},onFocus:C,deleteSmUp:!0,example:e.example,onDelete:function(){c(!0)},collapsed:s,onCollapseExited:function(t){return e.onUpdate(u.delete(),!1)},hint:null===(a=e.settings)||void 0===a?void 0:a.rightHint,moodsText:"How do you feel after writing resolution?",moodsArray:g,onMoodsArrayChange:function(e){return y(u.setMoodsRight(e.map((function(e){return e.value}))))}}):d.a.createElement(E.a,{variant:"rect",height:135})))})),L=n(222),Y=n.n(L),W=n(78),V=n.n(W),K=n(248),G=n(7),Z=n(194),J=n(249),X=n(189),q=n(223),Q=function(e){Object(l.a)(n,e);var t=Object(i.a)(n);function n(){var e;Object(r.a)(this,n);for(var a=arguments.length,o=new Array(a),l=0;l<a;l++)o[l]=arguments[l];return(e=t.call.apply(t,[this].concat(o)))._ref=d.a.createRef(),e._resizeObserver=void 0,e.onHeightChanged=function(){e._ref.current&&e.props.onHeightChanged(e.props.entry,e._ref.current.offsetHeight)},e}return Object(o.a)(n,[{key:"componentDidMount",value:function(){this._ref.current&&(this._resizeObserver=new ResizeObserver(this.onHeightChanged),this._resizeObserver.observe(this._ref.current))}},{key:"componentWillUnmount",value:function(){this._resizeObserver&&(this._resizeObserver.disconnect(),this._resizeObserver=void 0)}},{key:"render",value:function(){var e=this.props,t=e.ItemComponent,n=e.componentProps,a=e.entry;return d.a.createElement(t,Object.assign({ref:this._ref,entry:a},n))}}]),n}(d.a.PureComponent);function $(e){var t=d.a.useState(0),n=Object(p.a)(t,2),a=n[0],r=n[1],o=d.a.useState(window.innerHeight),l=Object(p.a)(o,2),i=l[0],s=l[1],c=d.a.useState(new Map),u=Object(p.a)(c,2),f=u[0],h=u[1],v=d.a.useMemo((function(){return Object(m.a)({},e.componentProps)}),Object.values(e.componentProps)),g=d.a.useCallback((function(e,t){h((function(n){var a=new Map(n);return a.set(e.key,t),a}))}),[]),b=new Set(e.entries.map((function(e){return e.key}))),y=[];f.forEach((function(e,t){b.has(t)||y.push(t)})),y.length>0&&h((function(e){var t=new Map(e);return y.forEach((function(n){e.has(n)&&t.delete(n)})),t}));var E=function(){e.scrollableContainerRef.current&&r(e.scrollableContainerRef.current.scrollTop),s(window.innerHeight)};d.a.useEffect((function(){return e.scrollableContainerRef.current&&(e.scrollableContainerRef.current.onscroll=E),window.addEventListener("resize",E),function(){window.removeEventListener("resize",E)}}));var C,x=[],w=0,k=0,R=0,O=Object(q.a)(e.entries);try{for(O.s();!(C=O.n()).done;){var j=C.value,z=e.defaultHeight;f.has(j.key)&&(z=f.get(j.key)),!e.example&&w+z<a-window.innerHeight?(j.focused&&e.scrollableContainerRef.current&&(e.scrollableContainerRef.current.scrollTop=w),k+=z):e.example||w<a+2*i?x.push(d.a.createElement(Q,{key:j.key,onHeightChanged:g,entry:j,ItemComponent:e.ItemComponent,componentProps:v})):(j.focused&&e.scrollableContainerRef.current&&(e.scrollableContainerRef.current.scrollTop=w),R+=z),w+=z}}catch(D){O.e(D)}finally{O.f()}return 0!==k&&x.unshift(d.a.createElement(e.PlaceholderComponent,{height:k,key:"placeholderTop"})),0!==R&&x.push(d.a.createElement(e.PlaceholderComponent,{height:R,key:"placeholderBottom"})),d.a.createElement(d.a.Fragment,null,x)}var ee=n(85),te=n.n(ee),ne=n(242),ae=n(55),re=n.n(ae);function oe(e){var t=e.height,n=Object(s.a)(e,["height"]);return d.a.createElement("tr",n,d.a.createElement("td",{colSpan:2},d.a.createElement("div",{style:{height:t}})))}var le=Object(G.a)((function(e){return Object(K.a)({scrollableContainer:{overflow:function(e){return e.example?"hide":"auto"},flex:1,willChange:"transform"},grip:{"&:hover":{backgroundColor:"#00F8",transitionDuration:"0s"},width:8,zIndex:10,position:"absolute",height:"100%",backgroundColor:"#0000",cursor:"col-resize",transitionProperty:"background-color",transitionDuration:"1s"},entriesTable:Object(c.a)({width:"100%",borderSpacing:0,"& td":{padding:2,verticalAlign:"top",borderLeft:"5px solid #0000",overflow:"inherit !important"},"& td:nth-child(odd)":{borderRight:"5px solid #0000",borderLeft:"20px solid #0000"}},e.breakpoints.down("xs"),{"& thead":{display:"none"},"& tbody tr":{display:"grid",padding:5,marginBottom:5,borderRadius:4,border:"1px solid",borderColor:e.palette.text.secondary},"& td:nth-child(odd)":{borderRight:0,borderLeft:0},"& tbody td":{display:"block",borderLeft:0}}),buttonsContainer:{backgroundColor:e.palette.background.paper,borderBottom:"1px solid lightGray"},buttons:{display:"flex",justifyContent:"center"}})}))(function(e){Object(l.a)(n,e);var t=Object(i.a)(n);function n(){var e;Object(r.a)(this,n);for(var o=arguments.length,l=new Array(o),i=0;i<o;i++)l[i]=arguments[i];return(e=t.call.apply(t,[this].concat(l))).state={entries:[],canRedo:!1,canUndo:!1},e.onEntriesChanged=function(t,n,r){var o=r.canRedo,l=r.canUndo,i=Object(a.a)(t);if(t.length>0){for(var s=t[t.length-1].creationTime,c=t.length-2;c>=0;c--){var u=t[c].creationTime;null!=s?!e.props.example&&(null==u||u.getTime()<s.getTime())||null!=u&&u.getFullYear()===s.getFullYear()&&u.getMonth()===s.getMonth()&&u.getDay()===s.getDay()||(i.splice(c+1,0,new N(s)),s=u):s=u}null!=s&&i.splice(0,0,new N(s))}e.setState({entries:i,settings:n,canRedo:o,canUndo:l})},e.onKeyPress=function(t,n){if("ctrl+z"===t||"cmd+z"===t)e.props.model.undo(),n.preventDefault();else if("ctrl+y"===t||"cmd+y"===t||"ctrl+shift+z"===t||"cmd+shift+z"===t)e.props.model.redo(),n.preventDefault();else if("ctrl+enter"===t||"cmd+enter"===t)e.props.model.addNewItemThrottled(),n.preventDefault();else{if(0===n.target.tabIndex)return;"pageup"===t?(e.scrollBy(.8*-window.innerHeight),n.preventDefault()):"pagedown"===t?(e.scrollBy(.8*window.innerHeight),n.preventDefault()):"down"===t?(e.scrollBy(100),n.preventDefault()):"up"===t&&(e.scrollBy(-100),n.preventDefault())}},e._tableRef=d.a.createRef(),e._scrollableContainerRef=d.a.createRef(),e._columnResizer=void 0,e._resizeObserver=void 0,e._lastScrollTime=Date.now(),e}return Object(o.a)(n,[{key:"scrollBy",value:function(e){var t=this;requestAnimationFrame((function(){if(null!=t._scrollableContainerRef.current){var n=Date.now()-t._lastScrollTime;t._lastScrollTime=Date.now(),t._scrollableContainerRef.current.scrollBy({top:e,behavior:n>300?"smooth":"auto"})}}))}},{key:"componentDidMount",value:function(){var e=this;this.props.model.subscribe(this.onEntriesChanged),this.props.example||(re()(this._tableRef.current),this._columnResizer=new Y.a(this._tableRef.current,{liveDrag:!0,minWidth:100,gripInnerHtml:"<div class='".concat(this.props.classes.grip,"'></div>"),onResize:function(){window.dispatchEvent(new Event("resize"))}}),window.removeEventListener("resize",this._columnResizer.onResize),this._resizeObserver=new ResizeObserver(V.a.throttle((function(){var t;null===(t=e._columnResizer)||void 0===t||t.onResize()}),200)),this._resizeObserver.observe(this._tableRef.current))}},{key:"componentDidUpdate",value:function(e){this.props.model!==e.model&&(e.model.unsubscribe(this.onEntriesChanged),this.props.model.subscribe(this.onEntriesChanged))}},{key:"componentWillUnmount",value:function(){var e,t;this.props.model.unsubscribe(this.onEntriesChanged),this.props.example||(null===(e=this._columnResizer)||void 0===e||e.destroy(),this._tableRef.current&&(null===(t=this._resizeObserver)||void 0===t||t.unobserve(this._tableRef.current)))}},{key:"isMacintosh",value:function(){return navigator.platform.indexOf("Mac")>-1}},{key:"render",value:function(){var e=this;return d.a.createElement(d.a.Fragment,null,d.a.createElement(te.a,{handleFocusableElements:!0,handleKeys:["ctrl+z","cmd+z","ctrl+shift+z","cmd+shift+z","ctrl+y","cmd+y","ctrl+enter","cmd+enter","up","down","pagedown","pageup"],onKeyEvent:this.onKeyPress}),!this.props.example&&d.a.createElement(Z.a,{className:this.props.classes.buttonsContainer,container:!0,justify:"space-between",spacing:0},d.a.createElement(Z.a,{item:!0,xs:1,sm:2},!this.props.appBarShown&&d.a.createElement(b.a,{size:"small",onClick:this.props.onShowAppBar},d.a.createElement(ne.a,{color:"primary"}))),d.a.createElement(Z.a,{className:this.props.classes.buttons,item:!0,xs:6,sm:3},d.a.createElement(J.a,{title:this.isMacintosh()?"Cmd + Enter":"Ctrl + Enter"},d.a.createElement("span",null,d.a.createElement(X.a,{size:"small",onClick:function(){e.props.model.addNewItemThrottled()}},"Add new item")))),d.a.createElement(Z.a,{className:this.props.classes.buttons,item:!0,xs:5,sm:2},d.a.createElement(J.a,{title:this.isMacintosh()?"Cmd + Z":"Ctrl + Z"},d.a.createElement("span",null,d.a.createElement(X.a,{fullWidth:!0,size:"small",onClick:this.props.model.undo,disabled:!this.state.canUndo},"Undo"))),d.a.createElement(J.a,{title:this.isMacintosh()?"Cmd + Shift + Z":"Ctrl + Shift + Z"},d.a.createElement("span",null,d.a.createElement(X.a,{fullWidth:!0,size:"small",disabled:!this.state.canRedo,onClick:this.props.model.redo},"Redo"))))),d.a.createElement("div",{ref:this._scrollableContainerRef,className:this.props.classes.scrollableContainer},d.a.createElement("table",{cellPadding:0,cellSpacing:0,className:this.props.classes.entriesTable,ref:this._tableRef},d.a.createElement("thead",null,d.a.createElement("tr",null,d.a.createElement("th",null),d.a.createElement("th",null))),d.a.createElement("tbody",null,d.a.createElement($,{entries:this.state.entries,ItemComponent:B,PlaceholderComponent:oe,scrollableContainerRef:this._scrollableContainerRef,componentProps:{onUpdate:this.props.model.onUpdate,onFocus:this.props.onFocus,settings:this.state.settings,example:this.props.example},example:this.props.example,defaultHeight:80})))))}}]),n}(d.a.PureComponent));t.default=le}}]);
//# sourceMappingURL=2.94487782.chunk.js.map