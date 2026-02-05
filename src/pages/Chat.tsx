import React from 'react';
import { Video, Info, PlusCircle, Smile, ArrowUp, FileText, CheckCheck } from 'lucide-react';

const Chat: React.FC = () => {
    const messages = [
        {
            id: 1,
            user: 'Mom',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBmn67ExSn_s74grzEDyfbnsi6EiJXXiNd7oK30tT0AmifEF1bb4IzjW7RcbDAIcB6Cr0kJkKkXVUvNQ4loe1hSlJzdwy8OsEkxZhuccrT4TOQoGRfZD6FVruahktztvdXrwUU4u2-O6o3d-6DJ3EcTkWFWts4XfQNYHoVlzdfg24WfN3cwUirNzdw-SqP7oYtvjpdl5iitEjhnJWuWZYrKOorp6HrF_upH4bod6SFTwVlGuyd4DTMovz2gmZ_kfBX1bWc9VU-gfNEc',
            content: 'Did anyone scan the grocery receipt from earlier? Need to split the bill.',
            time: '10:42 AM',
            type: 'text',
            isMe: false,
        },
        {
            id: 2,
            user: 'Dad',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUb36FSRdA0VwTb-m_TLYiAU4WsvYJcctDf0gZGQzmvtl2-eSKNuHrENY2N_jdyPUloUGuRx6D3oQsjMSbbaH48EHNeX6MxYMX_SVODHaTdWxRqjhQbbGd0xDAAijXHqljX_7ETt5VK7YJiI4wHzCIr4s_hZRp1CZZzcY5vUBCYEUVVuhFwZMAdPMGTCTBJmGCq1HqEaX0XZKYrLoOLBHBQtP9alFOidFL5uCwp0tsCjdCLwjr-eskW4PkiQdhtkVtI6JFCy4UVghD',
            content: "I have it here, I'll scan it with FamilyOS AI now. 📄",
            time: '10:45 AM',
            type: 'text',
            isMe: false,
        },
        {
            id: 3,
            user: 'Me',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAQtCj6ZvO1DOkRQHOU01aD_QviWB782XmnrgRMmRawwS-NripJthrR_uRBZNh5YzWfn7sRBP76AmbTl-zugygMJ9Pzj6-l8rR6ze2UWJ4uFXhPBGrUnbqxt74uLuZHoU8o9KH5ZbFmKzzdsrbwN7SUkdZtp0QiAMvcQbvHlAeNr0leBSqswFq2gc7MBUkc7LgotxVlMvwcMIpUyuEAjW-IxuEfN_CGWXzKUXVG4uwQ4BlT1xSGJx8KylCAa1zxcT0XEJuZpV4N2EJW',
            content: 'Perfect! I also just uploaded the photos from dinner last night. Check them out!',
            time: '10:48 AM',
            type: 'text',
            isMe: true,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkEjsQQlTQzhxiCZjKHdyz-8yvi1Acapzo0A_IyR_-wzx3oB6AueLERQFQ5J6hoS-qky89HC39-gPlhGDfIwVT-O6iFnwYSxfNZoz6qFYw4L2Vnhlw_q9nPkmbqK-OcxWwigInd_aGpSpD-J89NuBaRGGjCRnjxaAMq6CNp5KKE2iPojvBgV8OqCDBgqZLr45HkKKUCM2kMS9ddQxfOUtnkI6abDRFE8iPNuXuaqpCC8J4V5STpHxSEweguQGw23zNz6iTcQtQYXGf',
        },
        {
            id: 4,
            user: 'Mom',
            avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGlz1yu8c8Urs26sJrbDa06Sl-zxM6xEAaXSIAyg7gk8y25cx6FY86sI72AVUA-TgrfYjSyrBclToNefNLHkCQSboBfg36-xS_kmuyyw5inT_u_3DAYWIGBGYBWr_HcNRTxyTBeThCTu7I_G0mhnoXl5jSRxHuqcI-BQjRO_MRQ3yJWtw86OnYSfYZFfA6pReBUDncB7WSTcJbs9av35A9QYzonhgIIJr-jSpIKiGSYFLwAnpwexTWFBssWhftVjm-Q92JS1svoG6O',
            content: 'WholeFoods_Receipt.pdf',
            time: '11:02 AM',
            type: 'file',
            isMe: false,
            fileSize: '245 KB',
        },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-background-light dark:bg-background-dark/50">
            {/* Header */}
            <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 dark:border-white/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20">
                            <div
                                className="size-full bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAXVQpF4yZi1dqq1vq7tYbK4AmA0gbQbrIpBfYo3qqqLr-CzXc18COnnAww5oHveZUStEe9Ry7t_ao0-ycFEmc5jWQVzvXSsRV9fML8KXks4qkEQ17MKKdq1Ej9uV5E955hHppYEL8GcefaAEzpfM6gZ0DFN3krZ-PC3yNkEtnL9xGU2t42t1Xq55fiLgv30gwZjf2NHqUjJMBMSMMS7xiOPoZGALnYj0HPIFnGBbYAL7UJ1LcmTyjcKIDOm3T2A_6Q_Lw6-YqfqGbw")' }}
                            />
                        </div>
                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-white"></span>
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">The Johnsons</h1>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">Mom, Dad, Sarah, +2 others</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
                        <Video size={20} />
                    </button>
                    <button className="p-2 text-primary hover:bg-primary/5 rounded-full transition-colors">
                        <Info size={20} />
                    </button>
                </div>
            </header>

            {/* Message List */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="flex justify-center">
                    <span className="px-3 py-1 bg-gray-200 dark:bg-white/10 rounded-full text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today</span>
                </div>

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-2 ${msg.isMe ? 'justify-end' : 'max-w-[85%]'}`}>
                        {!msg.isMe && (
                            <div
                                className="size-8 shrink-0 rounded-full bg-center bg-cover border border-gray-200"
                                style={{ backgroundImage: `url("${msg.avatar}")` }}
                            />
                        )}
                        <div className={`flex flex-col gap-1 ${msg.isMe ? 'items-end max-w-[85%]' : ''}`}>
                            {!msg.isMe && <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 ml-1">{msg.user}</span>}

                            {msg.type === 'text' && (
                                <div className={`rounded-2xl px-4 py-2 shadow-sm border ${msg.isMe
                                        ? 'bg-primary text-white border-transparent rounded-br-none'
                                        : 'bg-white dark:bg-white/5 text-gray-800 dark:text-gray-100 border-gray-100 dark:border-white/5 rounded-bl-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                </div>
                            )}

                            {msg.image && (
                                <div className="mt-2 w-full max-w-[240px] rounded-xl overflow-hidden shadow-sm border-2 border-primary/20">
                                    <img src={msg.image} alt="attached" className="w-full aspect-[4/3] object-cover" />
                                </div>
                            )}

                            {msg.type === 'file' && (
                                <div className="rounded-2xl rounded-bl-none overflow-hidden bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5 p-1">
                                    <div className="rounded-xl overflow-hidden bg-gray-100 dark:bg-white/10 p-3 flex items-center gap-3">
                                        <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold truncate text-gray-800 dark:text-white">{msg.content}</p>
                                            <p className="text-[10px] text-gray-500">{msg.fileSize} • Scanned via AI</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={`flex items-center gap-1 mt-1 ${msg.isMe ? 'mr-1' : 'ml-1'}`}>
                                <span className="text-[10px] text-gray-400">{msg.time}</span>
                                {msg.isMe && <CheckCheck size={14} className="text-primary" />}
                            </div>
                        </div>
                        {msg.isMe && (
                            <div
                                className="size-8 shrink-0 rounded-full bg-center bg-cover border border-primary/20"
                                style={{ backgroundImage: `url("${msg.avatar}")` }}
                            />
                        )}
                    </div>
                ))}
            </main>

            {/* Input Area */}
            <div className="bg-white/80 dark:bg-background-dark/80 border-t border-gray-200 dark:border-white/10 px-4 pt-3 pb-8">
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center size-9 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                        <PlusCircle size={24} />
                    </button>
                    <div className="flex-1 relative">
                        <input
                            className="w-full bg-gray-100 dark:bg-white/5 border-none focus:ring-1 focus:ring-primary rounded-full px-4 py-2 text-sm placeholder:text-gray-500 dark:text-white"
                            placeholder="Message"
                            type="text"
                        />
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary">
                            <Smile size={20} />
                        </button>
                    </div>
                    <button className="flex items-center justify-center size-9 bg-primary text-white rounded-full shadow-lg shadow-primary/25">
                        <ArrowUp size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
