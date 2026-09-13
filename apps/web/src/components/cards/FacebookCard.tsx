/**
 * Facebook post card — adapted from the Paper design export
 * (FS-0, Sep 11, 2026). Two variants:
 * - FacebookPostImage: header + text + image + footer
 * - FacebookPostText:  header + text + footer (no image block)
 *
 * Paper 18R variants (FacebookPostText / FacebookPostImage below) carry the
 * same names; the legacy shell above is retained for PlatformCard.
 */

import { Fragment } from 'react'
import { highlightQuote } from './QuoteHighlight'

export type FacebookPostVariant = 'image' | 'text'

export type FacebookPostProps = {
  variant?: FacebookPostVariant
  authorName?: string
  timeAgo?: string
  /** Post body lines (rendered with line breaks, like the Paper original). */
  lines?: string[]
  /** Image shown in the `image` variant. Falls back to a grey placeholder. */
  imageSrc?: string
  imageAlt?: string
  /** Avatar shown in the header. Falls back to an initial circle. */
  avatarUrl?: string
  likes?: number
  comments?: number
  shares?: number
  className?: string
  /** Listened phrases to quote-highlight inside the lines. */
  highlight?: string[]
}

const DEFAULT_LINES = [
  "Toilet broke and it's leaking all over the bathroom floor! Does anyone know",
  'a good plumber who can help me out in the Dallas Area? Kind of urgent it\'s',
  'leaking through the roof!'
]

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  return (
    <div className="w-[54.46px] h-[54.46px] rounded-[544.596px] overflow-clip relative shrink-0 bg-[#2F67F6]">
      {avatarUrl ? (
        <div
          className="w-[51.74px] h-[51.74px] left-[calc(50%+0px)] top-[calc(50%+0px)] rounded-[544.596px] absolute bg-origin-border bg-cover bg-position-[50%] [border-width:2.72298px] border-solid border-white"
          style={{ backgroundImage: `url(${avatarUrl})`, translate: '-50% -50%' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white text-[24px] font-bold font-['Satoshi',system-ui,sans-serif]">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 15.67 15.67" width="15.67" height="15.67" xmlns="http://www.w3.org/2000/svg" style={{ width: '15.67px', height: '15.67px', overflow: 'visible', flexShrink: '0' }}>
      <path d="M7.836 0.000C12.163 0.000 15.671 3.508 15.671 7.835C15.671 12.050 12.341 15.486 8.168 15.661C8.168 15.661 8.168 15.663 8.168 15.663C8.052 15.668 7.935 15.671 7.817 15.671C7.546 15.671 7.277 15.657 7.012 15.630C7.012 15.630 7.012 15.626 7.012 15.626C3.072 15.215 0.000 11.883 0.000 7.835C0.000 3.508 3.508 0.000 7.836 0.000ZM6.080 14.278C6.640 14.431 7.228 14.514 7.836 14.514C11.183 14.514 13.963 12.038 14.442 8.823C14.404 8.796 14.364 8.763 14.316 8.715C14.150 8.550 13.798 8.650 13.798 8.650C13.798 8.650 13.371 8.689 13.185 9.452C12.986 10.269 12.822 10.385 12.671 10.492C12.541 10.583 12.420 10.668 12.292 11.180C12.059 12.111 11.726 12.390 11.375 12.684C11.308 12.741 11.239 12.798 11.171 12.861C10.748 13.248 10.339 12.334 10.050 11.180C9.859 10.419 9.652 10.360 9.388 10.286C9.252 10.248 9.101 10.205 8.929 10.059C8.707 9.871 8.632 9.729 8.560 9.594C8.468 9.422 8.383 9.262 8.011 9.036C7.893 8.964 7.776 8.930 7.670 8.898C7.436 8.830 7.258 8.778 7.248 8.378C7.238 7.997 7.177 7.623 7.059 7.537C6.788 7.339 6.778 7.269 6.726 6.935C6.716 6.868 6.704 6.789 6.687 6.697C6.633 6.390 6.943 6.075 7.253 5.759C7.497 5.510 7.741 5.262 7.808 5.016C7.961 4.459 8.034 4.443 8.034 4.443C8.034 4.443 8.515 4.189 8.879 4.553C9.237 4.910 9.584 4.666 9.489 4.456C9.320 4.078 9.441 3.618 9.441 3.618C9.593 3.296 9.711 3.325 9.904 3.373C10.066 3.413 10.280 3.466 10.610 3.335C10.678 3.308 10.740 3.284 10.799 3.262C11.371 3.043 11.523 2.985 11.171 2.214C11.156 2.180 11.142 2.148 11.129 2.117C11.114 2.078 11.100 2.040 11.087 2.004C10.334 1.582 9.491 1.302 8.595 1.200C8.268 1.225 7.219 1.354 7.161 1.975C7.153 2.058 7.205 2.173 7.260 2.295C7.387 2.575 7.530 2.892 7.015 2.950C6.683 2.987 6.348 3.105 6.011 3.222C5.600 3.366 5.187 3.510 4.774 3.510C4.311 3.510 5.080 2.294 5.150 2.206C5.202 2.140 5.365 1.782 5.447 1.599C4.474 1.973 3.608 2.568 2.915 3.324C2.895 3.379 2.875 3.440 2.854 3.512C2.701 4.027 2.764 4.431 2.815 4.756C2.841 4.921 2.864 5.065 2.854 5.193C2.773 6.230 1.866 7.454 1.866 7.454C1.680 7.745 1.497 7.856 1.337 7.952C1.274 7.990 1.216 8.025 1.162 8.068C1.176 8.485 1.229 8.892 1.317 9.286C1.464 9.126 1.863 8.748 2.137 9.045C2.299 9.220 2.322 9.569 2.344 9.904C2.372 10.325 2.398 10.723 2.697 10.726C3.234 10.730 4.320 11.327 4.379 11.846C4.391 11.956 4.555 12.057 4.777 12.195C5.293 12.515 6.121 13.028 6.080 14.278Z" fillRule="evenodd" fill="#838395" />
    </svg>
  )
}

function DotsIcon() {
  return (
    <div className="w-[27.23px] h-[27.23px] overflow-clip relative shrink-0 bg-white">
      <svg viewBox="0 0 27.23 27.23" width="27.23" height="27.23" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '27.23px', height: '27.23px', overflow: 'visible', position: 'absolute' }}>
        <path transform="matrix(1 0 0 1 10.892 10.892)" d="M5.446 2.723C5.446 4.227 4.227 5.446 2.723 5.446C1.219 5.446 0.000 4.227 0.000 2.723C0.000 1.219 1.219 0.000 2.723 0.000C4.227 0.000 5.446 1.219 5.446 2.723Z" fillRule="nonzero" fill="#666666" />
        <path transform="matrix(1 0 0 1 2.723 10.892)" d="M5.446 2.723C5.446 4.227 4.227 5.446 2.723 5.446C1.219 5.446 0.000 4.227 0.000 2.723C0.000 1.219 1.219 0.000 2.723 0.000C4.227 0.000 5.446 1.219 5.446 2.723Z" fillRule="nonzero" fill="#666666" />
        <path transform="matrix(1 0 0 1 19.061 10.892)" d="M2.723 0.000C4.227 0.000 5.446 1.219 5.446 2.723C5.446 4.227 4.227 5.446 2.723 5.446C1.219 5.446 0.000 4.227 0.000 2.723C0.000 1.219 1.219 0.000 2.723 0.000Z" fillRule="nonzero" fill="#666666" />
      </svg>
    </div>
  )
}

function CloseIcon() {
  return (
    <div className="w-[27.23px] h-[27.23px] overflow-clip relative shrink-0 bg-white">
      <svg viewBox="0 0 27.23 27.23" width="27.23" height="27.23" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '27.23px', height: '27.23px', overflow: 'visible', position: 'absolute' }}>
        <path transform="matrix(1 0 0 1 5.446 5.446)" d="M0.000 0.000C0.000 0.000 16.338 16.338 16.338 16.338" vectorEffect="non-scaling-stroke" fill="none" stroke="#666666" strokeWidth="2.723" strokeLinecap="round" />
        <path transform="matrix(0 1 -1 0 21.784 5.446)" d="M0.000 0.000C0.000 0.000 16.338 16.338 16.338 16.338" vectorEffect="non-scaling-stroke" fill="none" stroke="#666666" strokeWidth="2.723" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function ReactionStack() {
  return (
    <div className="flex items-center">
      <div className="w-[21.78px] h-[21.78px] relative shrink-0">
        <svg viewBox="0 0 21.78 21.78" width="21.78" height="21.78" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '21.78px', height: '21.78px', overflow: 'visible', position: 'absolute' }}>
          <path d="M13.495 0.318C19.335 1.756 22.903 7.655 21.466 13.495C20.028 19.335 14.129 22.903 8.289 21.466C2.449 20.028 -1.119 14.129 0.318 8.289C1.756 2.449 7.655 -1.119 13.495 0.318Z" fillRule="nonzero" fill="#4080FF" />
          <path transform="matrix(1 0 0 1 4.791 9.183)" d="M0.000 0.000C0.000 0.000 2.842 0.000 2.842 0.000C2.842 0.000 2.842 6.388 2.842 6.388C2.842 6.388 0.000 6.388 0.000 6.388C0.000 6.388 0.000 0.000 0.000 0.000Z" fillRule="nonzero" fill="#FFFFFF" />
          <path transform="matrix(1 0 0 1 8.705 4.5)" d="M7.351 5.521C7.633 5.341 7.821 5.036 7.821 4.675C7.821 4.127 7.374 3.681 6.826 3.681C6.826 3.681 3.773 3.681 3.773 3.681C3.812 3.047 3.836 2.029 3.726 1.043C3.546 -0.554 1.863 0.158 1.863 0.158C2.748 2.108 0.000 5.568 0.000 5.568C0.000 5.568 0.000 10.735 0.000 10.735C0.000 10.735 5.691 10.735 5.691 10.735C6.239 10.735 6.685 10.288 6.685 9.740C6.685 9.466 6.576 9.216 6.396 9.036C6.881 8.965 7.257 8.558 7.257 8.049C7.257 7.775 7.147 7.525 6.967 7.345C7.453 7.274 7.828 6.867 7.828 6.359C7.828 6.006 7.641 5.693 7.359 5.513C7.359 5.513 7.351 5.521 7.351 5.521Z" fillRule="nonzero" fill="#FFFFFF" />
        </svg>
      </div>
      <div className="w-[21.78px] h-[21.78px] relative shrink-0 [margin-left:-2.72px]">
        <svg viewBox="0 0 21.78 21.78" width="21.78" height="21.78" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '21.78px', height: '21.78px', overflow: 'visible', position: 'absolute' }}>
          <path d="M12.644 0.144C18.580 1.111 22.608 6.708 21.640 12.644C20.672 18.580 15.076 22.608 9.140 21.640C3.203 20.672 -0.824 15.076 0.144 9.140C1.111 3.203 6.708 -0.824 12.644 0.144Z" fillRule="nonzero" fill="#F25268" />
          <path transform="matrix(1 0 0 1 4.027 5.808)" d="M6.861 11.562C6.861 11.562 12.208 7.232 12.208 7.232C12.795 6.755 13.273 6.113 13.508 5.369C14.486 2.292 11.699 -1.004 8.387 0.288C7.495 0.640 6.853 1.807 6.853 1.807C6.853 1.807 6.211 0.640 5.318 0.288C2.014 -1.004 -0.780 2.292 0.198 5.369C0.441 6.121 0.911 6.755 1.498 7.232C1.498 7.232 6.845 11.562 6.845 11.562C6.845 11.562 6.861 11.562 6.861 11.562Z" fillRule="nonzero" fill="#FFFFFF" />
        </svg>
      </div>
      <div className="w-[21.78px] h-[21.78px] relative shrink-0 [margin-left:-2.72px]">
        <svg viewBox="0 0 21.78 21.78" width="21.78" height="21.78" xmlns="http://www.w3.org/2000/svg" style={{ left: '0px', top: '0px', width: '21.78px', height: '21.78px', overflow: 'visible', position: 'absolute' }}>
          <path d="M12.586 0.134C18.528 1.070 22.585 6.645 21.650 12.586C20.714 18.527 15.139 22.585 9.198 21.650C3.256 20.714 -0.802 15.139 0.134 9.198C1.070 3.256 6.645 -0.802 12.586 0.134Z" fillRule="nonzero" fill="#FDDA74" />
          <path transform="matrix(1 0 0 1 8.093 12.253)" d="M5.446 3.404C5.446 5.284 4.227 6.807 2.723 6.807C1.219 6.807 0.000 5.284 0.000 3.404C0.000 1.524 1.219 0.000 2.723 0.000C4.227 0.000 5.446 1.524 5.446 3.404Z" fillRule="nonzero" fill="#3C3C3B" />
          <path transform="matrix(1 0 0 1 5.446 6.807)" d="M2.723 2.042C2.723 3.170 2.113 4.084 1.361 4.084C0.610 4.084 0.000 3.170 0.000 2.042C0.000 0.914 0.610 0.000 1.361 0.000C2.113 0.000 2.723 0.914 2.723 2.042Z" fillRule="nonzero" fill="#3C3C3B" />
          <path transform="matrix(1 0 0 1 13.615 6.807)" d="M2.723 2.042C2.723 3.170 2.113 4.084 1.361 4.084C0.610 4.084 0.000 3.170 0.000 2.042C0.000 0.914 0.610 0.000 1.361 0.000C2.113 0.000 2.723 0.914 2.723 2.042Z" fillRule="nonzero" fill="#3C3C3B" />
          <path transform="matrix(1 0 0 1 5.37 4.084)" d="M2.422 1.361C2.345 1.361 2.268 1.325 2.208 1.246C1.752 0.648 0.960 0.648 0.510 1.246C0.394 1.398 0.202 1.398 0.087 1.246C-0.029 1.095 -0.029 0.843 0.087 0.692C0.427 0.245 0.878 0.000 1.361 0.000C1.845 0.000 2.296 0.245 2.636 0.692C2.752 0.843 2.752 1.095 2.636 1.246C2.576 1.325 2.499 1.361 2.422 1.361Z" fillRule="nonzero" fill="#3C3C3B" />
          <path transform="matrix(1 0 0 1 13.539 4.084)" d="M2.422 1.361C2.345 1.361 2.268 1.325 2.208 1.246C1.752 0.648 0.960 0.648 0.510 1.246C0.394 1.398 0.202 1.398 0.087 1.246C-0.029 1.095 -0.029 0.843 0.087 0.692C0.427 0.245 0.878 0.000 1.361 0.000C1.845 0.000 2.296 0.245 2.636 0.692C2.752 0.843 2.752 1.095 2.636 1.246C2.576 1.325 2.499 1.361 2.422 1.361Z" fillRule="nonzero" fill="#3C3C3B" />
        </svg>
      </div>
    </div>
  )
}

function LikeIcon() {
  return (
    <div className="w-[21.78px] h-[21.78px] overflow-clip relative shrink-0 bg-white">
      <svg viewBox="0 0 19.35 18.52" width="19.35" height="18.52" xmlns="http://www.w3.org/2000/svg" style={{ left: '1.3614px', top: '1.3615px', width: '19.35px', height: '18.52px', overflow: 'visible', position: 'absolute' }}>
        <path transform="matrix(1 0 0 1 0 7.099)" d="M0.000 0.000C0.000 0.000 4.684 0.000 4.684 0.000C4.684 0.000 4.684 11.423 4.684 11.423C4.684 11.423 0.000 11.423 0.000 11.423C0.000 11.423 0.000 0.000 0.000 0.000Z" vectorEffect="non-scaling-stroke" fill="none" stroke="#838395" strokeWidth="1.566" strokeLinejoin="round" />
        <path transform="matrix(1 0 0 1 4.684 0)" d="M13.887 9.386C14.350 9.100 14.663 8.583 14.663 7.997C14.663 7.085 13.928 6.350 13.016 6.350C13.016 6.350 7.978 6.350 7.978 6.350C8.033 5.301 7.910 2.810 7.801 1.176C7.692 -0.539 5.405 0.128 5.405 0.128C5.732 3.300 3.649 6.704 1.756 8.106C1.375 8.392 0.000 8.800 0.000 8.800C0.000 8.800 0.000 17.963 0.000 17.963C0.000 17.963 11.137 17.963 11.137 17.963C12.049 17.963 12.784 17.228 12.784 16.316C12.784 15.867 12.607 15.458 12.308 15.159C13.111 15.050 13.724 14.369 13.724 13.538C13.724 13.089 13.547 12.681 13.247 12.381C14.051 12.272 14.663 11.591 14.663 10.761C14.663 10.176 14.350 9.658 13.887 9.372C13.887 9.372 13.887 9.386 13.887 9.386Z" vectorEffect="non-scaling-stroke" fill="none" stroke="#838395" strokeWidth="1.566" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ShareIcon() {
  return (
    <div className="w-[21.78px] h-[21.78px] overflow-clip relative shrink-0">
      <svg viewBox="0 0 20.42 18.3" width="20.42" height="18.3" xmlns="http://www.w3.org/2000/svg" style={{ width: '20.42px', height: '18.3px', left: 'calc(50% + 0px)', top: 'calc(50% + 0px)', overflow: 'visible', translate: '-50% -50%', position: 'absolute' }}>
        <path d="M20.073 7.627C20.073 7.627 11.534 0.246 11.534 0.246C11.236 -0.013 10.814 -0.073 10.455 0.091C10.096 0.256 9.865 0.614 9.865 1.009C9.865 1.009 9.865 3.231 9.865 3.231C7.277 3.724 4.908 5.058 3.118 7.046C1.107 9.279 0.000 12.154 0.000 15.142C0.000 15.142 0.000 17.286 0.000 17.286C0.000 17.731 0.292 18.123 0.718 18.252C0.814 18.281 0.912 18.295 1.009 18.295C1.341 18.295 1.659 18.131 1.850 17.844C3.663 15.112 6.636 13.437 9.865 13.305C9.865 13.305 9.865 15.352 9.865 15.352C9.865 15.741 10.089 16.096 10.441 16.263C10.793 16.430 11.210 16.380 11.512 16.134C11.512 16.134 20.051 9.173 20.051 9.173C20.282 8.984 20.418 8.703 20.422 8.405C20.427 8.107 20.299 7.822 20.073 7.627ZM11.883 13.227C11.883 13.227 11.883 12.287 11.883 12.287C11.883 11.730 11.432 11.278 10.874 11.278C10.874 11.278 10.278 11.278 10.278 11.278C7.185 11.278 4.257 12.458 2.037 14.525C2.331 9.655 6.080 5.656 10.988 5.100C11.498 5.042 11.883 4.610 11.883 4.097C11.883 4.097 11.883 3.215 11.883 3.215C11.883 3.215 17.844 8.368 17.844 8.368C17.844 8.368 11.883 13.227 11.883 13.227Z" fillRule="nonzero" fill="#838395" />
      </svg>
    </div>
  )
}

function CommentIcon() {
  return (
    <div className="w-[21.78px] h-[21.78px] overflow-clip relative shrink-0 origin-center" style={{ rotate: '180deg' }}>
      <svg viewBox="0 0 19.06 20.42" width="19.06" height="20.42" xmlns="http://www.w3.org/2000/svg" style={{ width: '19.06px', height: '20.42px', left: 'calc(50% + 0px)', top: 'calc(50% + 0.68px)', overflow: 'visible', translate: '-50% -50%', position: 'absolute' }}>
        <g transform="translate(0 20.42) scale(1 -1)">
          <path d="M14.087 1.172C12.227 0.149 10.081 -0.219 7.99 0.127C5.9 0.473 3.983 1.514 2.542 3.084C1.102 4.654 0.22 6.664 0.036 8.797C-0.146 10.91 0.367 13.024 1.494 14.813L0.431 19.487C0.4 19.622 0.406 19.764 0.449 19.895C0.492 20.027 0.569 20.145 0.673 20.235C0.777 20.326 0.904 20.387 1.04 20.411C1.176 20.435 1.316 20.421 1.444 20.37L6.014 18.585C7.133 19.038 8.327 19.272 9.533 19.27C11.652 19.269 13.71 18.555 15.382 17.24C17.054 15.925 18.245 14.084 18.767 12.009C19.289 9.934 19.112 7.742 18.265 5.78C17.418 3.818 15.948 2.196 14.087 1.172ZM2.934 14.231C2.01 12.88 1.515 11.275 1.516 9.631C1.516 8.028 1.987 6.46 2.868 5.127C3.749 3.794 5.001 2.755 6.466 2.142C7.931 1.529 9.542 1.367 11.097 1.68C12.652 1.993 14.08 2.765 15.201 3.899C16.323 5.033 17.086 6.477 17.396 8.05C17.705 9.623 17.547 11.253 16.94 12.734C16.333 14.216 15.306 15.482 13.988 16.373C12.669 17.263 11.119 17.738 9.533 17.738C8.431 17.74 7.336 17.507 6.327 17.058C6.142 16.98 5.935 16.98 5.75 17.056L2.232 18.422L3.048 14.836C3.072 14.733 3.074 14.626 3.055 14.523C3.036 14.419 2.993 14.319 2.934 14.231Z" fillRule="nonzero" fill="#838395" />
        </g>
      </svg>
    </div>
  )
}

export function FacebookCard({
  variant = 'image',
  authorName = 'Piyatida Kamolmas',
  timeAgo = '15h',
  lines = DEFAULT_LINES,
  imageSrc,
  imageAlt = 'Post image',
  avatarUrl,
  likes = 4,
  comments = 0,
  shares = 5,
  className = '',
  highlight = []
}: FacebookPostProps) {
  return (
    <div className={`[font-synthesis:none] [overflow-wrap:anywhere] flex flex-col items-center py-[16.34px] rounded-[21.7838px] overflow-clip gap-[13.61px] justify-center [box-shadow:#0000000D_0px_14px_14px_9px] bg-white antialiased ${className}`}>
      <div className="self-stretch min-w-0 flex flex-col items-center gap-[21.78px]">
        <div className="self-stretch min-w-0 flex flex-col items-start px-[16.34px] gap-[10.89px]">
          <div className="self-stretch min-w-0 flex items-start justify-between">
            <div className="flex items-center gap-[5.45px]">
              <Avatar name={authorName} avatarUrl={avatarUrl} />
              <div className="w-[249.15px] flex flex-col items-start gap-[5.45px] shrink-0">
                <div className="self-stretch min-w-0 flex items-center gap-[5.45px]">
                  <div className="text-[20.42px] content-center min-w-0 max-w-full truncate font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#1C1E21]">
                    {authorName}
                  </div>
                  <div className="text-[10.89px] content-center w-max shrink-0 font-['Satoshi',system-ui,sans-serif] font-[700] text-[#1C1E21]">
                    •
                  </div>
                  <div className="text-[19.06px] content-center w-max shrink-0 font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#1877F2]">
                    Follow
                  </div>
                </div>
                <div className="flex items-center gap-[5.45px]">
                  <div className="text-[16.34px] content-center w-max font-['Satoshi',system-ui,sans-serif] leading-5 text-[#838395]">
                    {timeAgo}
                  </div>
                  <div className="text-[10.89px] content-center w-max font-['Satoshi',system-ui,sans-serif] text-[#838395]">
                    •
                  </div>
                  <GlobeIcon />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-[21.78px]">
              <DotsIcon />
              <CloseIcon />
            </div>
          </div>
          <div className="text-[19.06px] self-stretch min-w-0 text-left leading-[27.2298px] whitespace-pre line-clamp-3 font-['Satoshi',system-ui,sans-serif] text-[#1C1C22]">
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {highlightQuote(line, highlight)}
              </Fragment>
            ))}
          </div>
        </div>
        {variant === 'image' && (
          imageSrc ? (
            <img src={imageSrc} alt={imageAlt} className="h-[517.37px] self-stretch min-w-0 shrink-0 object-cover" />
          ) : (
            <div className="h-[517.37px] self-stretch min-w-0 shrink-0 bg-[#D9D9D9]" />
          )
        )}
        <div className="self-stretch min-w-0 flex flex-col items-center px-[16.34px] gap-[16.34px]">
          <div className="self-stretch min-w-0 flex items-center justify-between">
            <div className="flex items-center gap-[5.45px]">
              <ReactionStack />
              <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
                {likes}
              </div>
            </div>
            <div className="flex items-center gap-[10.89px]">
              <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
                {comments} comments
              </div>
              <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
                {shares} shares
              </div>
            </div>
          </div>
          <svg viewBox="0 0 680.74 1" preserveAspectRatio="none" width="680.74" height="1" xmlns="http://www.w3.org/2000/svg" style={{ alignSelf: 'stretch', minWidth: '0px', height: '1px', overflow: 'visible', flexShrink: '0' }}>
            <path d="M0.000 0.000C0.000 0.000 680.745 0.000 680.745 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#BBBBD0" strokeWidth="1.361" />
          </svg>
          <div className="self-stretch min-w-0 flex items-center justify-center gap-[108.92px]">
            <div className="grow basis-[680.74px] min-w-[517.37px] flex items-center justify-between px-[81.69px]">
              <div className="flex items-center justify-center gap-[10.89px]">
                <LikeIcon />
                <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
                  Like
                </div>
              </div>
              <div className="flex items-center justify-center gap-[10.89px]">
                <CommentIcon />
                <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
                  Comment
                </div>
              </div>
              <div className="flex items-center justify-center gap-[10.89px]">
                <ShareIcon />
                <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
                  Share
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export type FacebookPaperProps = {
  authorName?: string
  timeAgo?: string
  lines?: string[]
  imageSrc?: string
  avatarUrl?: string
  likes?: string
  comments?: string
  shares?: string
  /** Listened phrases to quote-highlight inside the body. */
  highlight?: string[]
}

const FACEBOOK_PAPER_AVATAR =
  'https://app.paper.design/file-assets/01M1DEEQY42BZFA01XT004M9ZZ/1AKXGFVKN3AH8Q49Y8WMB6Q70S.png'

const FACEBOOK_PAPER_LINES = [
  'Hi! Here are our 2025 social post templates—feel free to use them.',
  'If you have a moment, we’d truly appreciate a like!'
]

function FacebookPaperBody({ lines, highlight = [] }: { lines: string[]; highlight?: string[] }) {
  return (
    <div className="text-[19.06px] content-center leading-[27.2298px] w-max whitespace-pre line-clamp-3 font-['Satoshi',system-ui,sans-serif] text-[#1C1C22]">
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {highlightQuote(line, highlight)}
        </Fragment>
      ))}
    </div>
  )
}

function FacebookPaperFooter({ likes, comments, shares }: { likes: string; comments: string; shares: string }) {
  return (
    <div className="self-stretch min-w-0 flex flex-col items-center px-[16.34px] gap-[16.34px]">
      <div className="self-stretch min-w-0 flex items-center justify-between">
        <div className="flex items-center gap-[5.45px]">
          <ReactionStack />
          <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
            {likes}
          </div>
        </div>
        <div className="flex items-center gap-[10.89px]">
          <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
            {comments}
          </div>
          <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[500] leading-6 text-[#838395]">
            {shares}
          </div>
        </div>
      </div>
      <svg viewBox="0 0 680.74 1" preserveAspectRatio="none" width="680.74" height="1" xmlns="http://www.w3.org/2000/svg" style={{ alignSelf: 'stretch', minWidth: '0px', height: '1px', overflow: 'visible', flexShrink: '0' }}>
        <path d="M0.000 0.000C0.000 0.000 680.745 0.000 680.745 0.000" vectorEffect="non-scaling-stroke" fill="none" stroke="#BBBBD0" strokeWidth="1.361" />
      </svg>
      <div className="self-stretch min-w-0 flex items-center justify-center gap-[108.92px]">
        <div className="grow basis-[680.74px] min-w-[517.37px] flex items-center justify-between px-[81.69px]">
          <div className="flex items-center justify-center gap-[10.89px]">
            <LikeIcon />
            <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
              Like
            </div>
          </div>
          <div className="flex items-center justify-center gap-[10.89px]">
            <CommentIcon />
            <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
              Comment
            </div>
          </div>
          <div className="flex items-center justify-center gap-[10.89px]">
            <ShareIcon />
            <div className="text-[19.06px] content-center w-max font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#838395]">
              Share
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FacebookPaperHeader({ authorName, timeAgo, avatarUrl }: { authorName: string; timeAgo: string; avatarUrl: string }) {
  return (
    <div className="self-stretch min-w-0 flex items-start justify-between">
      <div className="flex items-center gap-[5.45px]">
        <Avatar name={authorName} avatarUrl={avatarUrl} />
        <div className="w-[249.15px] flex flex-col items-start gap-[5.45px] shrink-0">
          <div className="self-stretch min-w-0 flex items-center gap-[5.45px]">
            <div className="text-[20.42px] content-center min-w-0 max-w-full truncate font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#1C1E21]">
              {authorName}
            </div>
            <div className="text-[10.89px] content-center w-max shrink-0 font-['Satoshi',system-ui,sans-serif] font-[700] leading-3 text-[#1C1E21]">
              •
            </div>
            <div className="text-[19.06px] content-center w-max shrink-0 font-['Satoshi',system-ui,sans-serif] font-[700] leading-6 text-[#1877F2]">
              Follow
            </div>
          </div>
          <div className="flex items-center gap-[5.45px]">
            <div className="text-[16.34px] content-center w-max font-['Satoshi',system-ui,sans-serif] leading-5 text-[#838395]">
              {timeAgo}
            </div>
            <div className="text-[10.89px] content-center w-max font-['Satoshi',system-ui,sans-serif] leading-3 text-[#838395]">
              •
            </div>
            <GlobeIcon />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-[21.78px]">
        <DotsIcon />
        <CloseIcon />
      </div>
    </div>
  )
}

/**
 * Text variant (Paper 18R-0, no image): header + text + footer.
 * from Paper
 * https://app.paper.design/file/01M1DEEQY42BZFA01XT004M9ZZ/01K4GP58P8JRM8PGBP0586VKYV/18R-0
 * on Sep 12, 2026
 */
export function FacebookPostText({
  authorName = 'Piyatida Kamolmas',
  timeAgo = '15h',
  lines = FACEBOOK_PAPER_LINES,
  avatarUrl = FACEBOOK_PAPER_AVATAR,
  likes = '650',
  comments = '48 comments',
  shares = '135 shares',
  highlight = []
}: FacebookPaperProps) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[713.42px] flex flex-col items-start py-[16.34px] rounded-[21.7838px] overflow-clip gap-[13.61px] bg-white antialiased">
      <div className="self-stretch min-w-0 flex flex-col items-center gap-[21.78px]">
        <div className="self-stretch min-w-0 flex flex-col items-start px-[16.34px] gap-[10.89px]">
          <FacebookPaperHeader authorName={authorName} timeAgo={timeAgo} avatarUrl={avatarUrl} />
          <FacebookPaperBody lines={lines} highlight={highlight} />
        </div>
        <FacebookPaperFooter likes={likes} comments={comments} shares={shares} />
      </div>
    </div>
  )
}

/**
 * Image variant (Paper 18R-0): header + text + image block + footer.
 */
export function FacebookPostImage({
  authorName = 'Piyatida Kamolmas',
  timeAgo = '15h',
  lines = FACEBOOK_PAPER_LINES,
  imageSrc,
  avatarUrl = FACEBOOK_PAPER_AVATAR,
  likes = '650',
  comments = '48 comments',
  shares = '135 shares',
  highlight = []
}: FacebookPaperProps) {
  return (
    <div className="[font-synthesis:none] [overflow-wrap:anywhere] w-[713.42px] flex flex-col items-start py-[16.34px] rounded-[21.7838px] overflow-clip gap-[13.61px] bg-white antialiased">
      <div className="self-stretch min-w-0 flex flex-col items-center gap-[21.78px]">
        <div className="self-stretch min-w-0 flex flex-col items-start px-[16.34px] gap-[10.89px]">
          <FacebookPaperHeader authorName={authorName} timeAgo={timeAgo} avatarUrl={avatarUrl} />
          <FacebookPaperBody lines={lines} highlight={highlight} />
        </div>
        {imageSrc ? (
          <div
            className="h-[517.37px] self-stretch min-w-0 shrink-0 bg-cover bg-position-[50%]"
            role="img"
            style={{ backgroundImage: `url(${imageSrc})` }}
          />
        ) : (
          <div className="h-[517.37px] self-stretch min-w-0 shrink-0 bg-[#D9D9D9]" />
        )}
        <FacebookPaperFooter likes={likes} comments={comments} shares={shares} />
      </div>
    </div>
  )
}
