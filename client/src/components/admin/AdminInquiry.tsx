import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/config";
import emailjs from "emailjs-com";
import type { Inquiry } from "../../firebase/types";

interface RespondedInquiry extends Inquiry {
  replySubject: string;
  replyMessage: string;
  repliedAt?: any;
}

const AdminInquire: React.FC = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [respondedInquiries, setRespondedInquiries] = useState<RespondedInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<RespondedInquiry | null>(null);
  const [subject, setSubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Color palette from AdminAnalysis
  const COLORS = {
    red: "#FF2400",
    green: "#0A5C36",
    yellow: "#FFC107",
    blue: "#4682B4",
    lightGray: "#F5F6F5",
  };

  // Fetch Pending Inquiries
  useEffect(() => {
    const q = query(collection(db, "inquiries"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: Inquiry[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Inquiry, "id">),
      }));
      setInquiries(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch Responded Inquiries
  useEffect(() => {
    const q = query(collection(db, "respondedInquiries"), orderBy("repliedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: RespondedInquiry[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RespondedInquiry, "id">),
      }));
      setRespondedInquiries(list);
    });
    return () => unsub();
  }, []);

  // Select a pending inquiry to reply
  const handleSelectInquiry = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setSubject("");
    setReplyMessage("");
  };

  // Select a responded inquiry to view details
  const handleSelectResponse = (res: RespondedInquiry) => {
    setSelectedResponse(res);
  };

  // Send reply via EmailJS and move to responded collection
  const sendReply = async () => {
    if (!selectedInquiry || !subject.trim() || !replyMessage.trim()) {
      alert("Please fill all fields before sending.");
      return;
    }

    setSending(true);
    try {
      await emailjs.send(
        "service_r8ot6gr", // Your EmailJS Service ID
        "template_8h1ten9", // Your EmailJS Template ID
        {
          to_email: selectedInquiry.email,
          to_name: selectedInquiry.name,
          subject: subject,
          message: replyMessage,
        },
        "4GrhFYcHfMKnLVajx" // Your EmailJS Public Key
      );

      // Move to respondedInquiries collection
      await addDoc(collection(db, "respondedInquiries"), {
        ...selectedInquiry,
        replySubject: subject,
        replyMessage: replyMessage,
        repliedAt: serverTimestamp(),
      });

      // Remove from inquiries
      await deleteDoc(doc(db, "inquiries", selectedInquiry.id));

      alert("Reply sent and moved to Responded Inquiries!");
      setSelectedInquiry(null);
      setSubject("");
      setReplyMessage("");
    } catch (error) {
      console.error("EmailJS Error:", error);
      alert("Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen p-6 transition-all duration-300" style={{ backgroundColor: COLORS.lightGray }}>
      <h1 className="text-3xl font-bold text-center mb-6" style={{ color: COLORS.red }}>
        📩 Admin Inquiry Dashboard
      </h1>

      {/* Pending Inquiries */}
      <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.red }}>
        Pending Inquiries
      </h2>
      {loading ? (
        <p className="text-center text-lg" style={{ color: COLORS.green }}>
          Loading inquiries...
        </p>
      ) : inquiries.length === 0 ? (
        <p className="text-center text-lg" style={{ color: COLORS.green }}>
          No pending inquiries.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md mb-6" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, borderWidth: 1 }}>
          <table className="min-w-full" style={{ borderColor: COLORS.blue }}>
            <thead style={{ backgroundColor: COLORS.lightGray }}>
              <tr>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Name
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Email
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Reason
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Date/Time
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Message
                </th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inq) => (
                <tr
                  key={inq.id}
                  className="cursor-pointer transition-all duration-300"
                  style={{ backgroundColor: COLORS.lightGray }}
                  onClick={() => handleSelectInquiry(inq)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.yellow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.lightGray)}
                >
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {inq.name}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {inq.email}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {inq.reason}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {inq.datetime || "-"}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {inq.message.length > 50 ? `${inq.message.slice(0, 50)}...` : inq.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Responded Inquiries */}
      <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.red }}>
        Responded Inquiries
      </h2>
      {respondedInquiries.length === 0 ? (
        <p className="text-center text-lg" style={{ color: COLORS.green }}>
          No responded inquiries yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow-md" style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, borderWidth: 1 }}>
          <table className="min-w-full" style={{ borderColor: COLORS.blue }}>
            <thead style={{ backgroundColor: COLORS.lightGray }}>
              <tr>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Name
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Email
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Reason
                </th>
                <th className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                  Replied At
                </th>
              </tr>
            </thead>
            <tbody>
              {respondedInquiries.map((res) => (
                <tr
                  key={res.id}
                  className="cursor-pointer transition-all duration-300"
                  style={{ backgroundColor: COLORS.lightGray }}
                  onClick={() => handleSelectResponse(res)}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS.yellow)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.lightGray)}
                >
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {res.name}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {res.email}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {res.reason}
                  </td>
                  <td className="px-4 py-2 border" style={{ borderColor: COLORS.blue, color: COLORS.green }}>
                    {res.repliedAt?.toDate
                      ? new Date(res.repliedAt.toDate()).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reply Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-300"
            style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, borderWidth: 1 }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.red }}>
              Reply to {selectedInquiry.name}
            </h2>
            <p className="text-sm mb-4" style={{ color: COLORS.green }}>
              <strong>Email:</strong> {selectedInquiry.email}
            </p>

            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 mb-3 rounded transition-all duration-300"
              style={{ borderColor: COLORS.blue, color: COLORS.green }}
            />
            <textarea
              placeholder="Your reply message..."
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              rows={4}
              className="w-full p-2 mb-4 rounded transition-all duration-300"
              style={{ borderColor: COLORS.blue, color: COLORS.green }}
            ></textarea>

            <div className="flex justify-end gap-3 mb-4">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 rounded transition-all duration-300"
                style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, color: COLORS.green }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.yellow;
                  e.currentTarget.style.color = COLORS.green;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.lightGray;
                  e.currentTarget.style.color = COLORS.green;
                }}
              >
                Cancel
              </button>
              <button
                onClick={sendReply}
                disabled={sending}
                className="px-4 py-2 rounded transition-all duration-300"
                style={{
                  backgroundColor: sending ? COLORS.lightGray : COLORS.green,
                  color: COLORS.lightGray,
                  borderColor: COLORS.blue,
                }}
                onMouseEnter={(e) => {
                  if (!sending) e.currentTarget.style.backgroundColor = COLORS.yellow;
                }}
                onMouseLeave={(e) => {
                  if (!sending) e.currentTarget.style.backgroundColor = COLORS.green;
                }}
              >
                {sending ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Response Details Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div
            className="p-6 rounded-lg shadow-lg w-full max-w-lg transition-all duration-300"
            style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, borderWidth: 1 }}
          >
            <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.red }}>
              Response Details
            </h2>

            {/* User Details */}
            <p style={{ color: COLORS.green }}>
              <strong>Name:</strong> {selectedResponse.name}
            </p>
            <p style={{ color: COLORS.green }}>
              <strong>Email:</strong> {selectedResponse.email}
            </p>
            <p style={{ color: COLORS.green }}>
              <strong>Reason:</strong> {selectedResponse.reason}
            </p>
            <p className="mt-2 text-sm" style={{ color: COLORS.green }}>
              <strong>Inquiry Date:</strong>{" "}
              {selectedResponse.createdAt?.toDate
                ? new Date(selectedResponse.createdAt.toDate()).toLocaleString()
                : "-"}
            </p>

            {/* Original Inquiry */}
            <hr className="my-3" style={{ borderColor: COLORS.blue }} />
            <p className="font-semibold" style={{ color: COLORS.green }}>
              Original Inquiry:
            </p>
            <p
              className="p-2 rounded text-sm whitespace-pre-wrap"
              style={{ backgroundColor: COLORS.lightGray, color: COLORS.green, borderColor: COLORS.blue, borderWidth: 1 }}
            >
              {selectedResponse.message || "No message provided"}
            </p>

            {/* Admin Reply */}
            <hr className="my-3" style={{ borderColor: COLORS.blue }} />
            <p style={{ color: COLORS.green }}>
              <strong>Reply Subject:</strong> {selectedResponse.replySubject}
            </p>
            <p className="font-semibold mt-1" style={{ color: COLORS.green }}>
              Reply Message:
            </p>
            <p
              className="p-2 rounded text-sm whitespace-pre-wrap"
              style={{ backgroundColor: COLORS.lightGray, color: COLORS.green, borderColor: COLORS.blue, borderWidth: 1 }}
            >
              {selectedResponse.replyMessage}
            </p>
            <p className="mt-2 text-sm" style={{ color: COLORS.green }}>
              <strong>Replied At:</strong>{" "}
              {selectedResponse.repliedAt?.toDate
                ? new Date(selectedResponse.repliedAt.toDate()).toLocaleString()
                : "-"}
            </p>

            {/* Close Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setSelectedResponse(null)}
                className="px-4 py-2 rounded transition-all duration-300"
                style={{ backgroundColor: COLORS.lightGray, borderColor: COLORS.blue, color: COLORS.green }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.yellow;
                  e.currentTarget.style.color = COLORS.green;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.lightGray;
                  e.currentTarget.style.color = COLORS.green;
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInquire;